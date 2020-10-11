const User = require('../components/user/userModel');
const catchAsync = require('../utils/catchAsync');
const jwt = require('jsonwebtoken');
const AppError = require('../utils/appError');
const sendEmail = require('../utils/email');
const crypto = require('crypto');
const {promisify} = require('util');

const signToken = id => {
    return jwt.sign({id}, process.env.JWT_SECRET, {expiresIn:process.env.JWT_EXPIRES});
}

const cookieOptions = {
    expires: new Date(Date.now()+process.env.JWT_COOKIE_EXPIRES*24*60*60*1000),
    httpOnly: true
}

const createSendToken = (user, statusCode, res) => {
    const token = signToken(user._id);

    if(process.env.NODE_ENV === 'production') cookieOptions.secure = true;
    res.cookie('jwt',token,cookieOptions);


    // for removing the password
    user.password = undefined
    res.status(statusCode).json({
        status:'success',
        token,
        data:{
            user
        }
    });
}
exports.signup = catchAsync( async (req,res,next) => {
    const newUser = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        passwordConfirm: req.body.passwordConfirm,
    });

    createSendToken(newUser, 201, res)
});


exports.login = catchAsync( async (req,res,next)=> {
    const {email , password} = req.body;

    // 1) chec if email and password exits
    if(!email || !password){
        return next(new AppError('Provide Correct Email and Password', 400));
    }

    // 2) check if user exists and password is correct
    const user = await User.findOne({ email }).select('+password');


    if(!user || !(await user.correctPassword(password, user.password))){
        return next(new AppError('Incorrext email or password', 401));
    }
    
    createSendToken(user, 200, res)
});

exports.protect = catchAsync(async (req,res,next)=> {
    // getting token and check it
    let token;
    if(req.headers.authorization && req.headers.authorization.startsWith('Bearer')){
        token = req.headers.authorization.split(' ')[1];
    }
    if(!token){
        return next(new AppError('You are not logged in',401));
    }

    // verify token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    // check user exits
    const user = await User.findById(decoded.id);

    if(!user){
        return next(new AppError('User doesnot exits', 401));
    }

    //check if user changes password
    if(user.changedPasswordAfter(decoded.iat)){
        return next(new AppError('You recently changes password please login again', 401));
    }
    
    req.user = user;
    next();
});

exports.restrictTo = (...roles) => {
    return (req,res,next) => {
        if(!roles.includes(req.user.role)){
            return next(new AppError('You donot have permission to delete', 403));
        }
        next();
    };
};

exports.forgotPassword = catchAsync(async (req,res,next) => {
    //user
    const user = await User.findOne({email : req.body.email});
    if(!user){
        return next(new AppError('There is no user with given email',401));
    }

    //generate token
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false});

    // send email
    const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;

    const message = `Forgot your password submit a patch request with your new password and confirm password to ${resetURL}.\n if you didn.t forgot your password, please ignore this email`;

    try {
        await sendEmail({
            email: user.email,
            subject: 'Your password reset token valid for 10 min',
            message: message
        });
    } catch (error) {
        user.passwordResetToken = undefined;
        user.passwordResetExpires =undefined;
        await user.save({ validateBeforeSave: false});

        return next(new AppError('Error sending an email, try again later', 500));
    }
    
    
    res.status(200).json({
        status: 'success',
        message: 'Token sent to your email'
    });
});

exports.resetPassword = catchAsync( async(req,res,next) => {
    // get user based on token
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({passwordResetToken: hashedToken, passwordResetExpires: {$gt: Date.now()}});
    // check token validity
    if(!user){
        return next(new AppError('Token is invalid or expired', 400));
    }
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetExpires = undefined;
    user.passwordResetToken = undefined;
    await user.save();

    // log your in, send jwt
    createSendToken(user, 200, res)
});

exports.updatePassword = catchAsync(async (req,res,next) => {
    // get user
    const user = await User.findById(req.user.id).select('+password');

    if(!(await user.correctPassword(req.body.currentPassword, user.password))){
        return next(new AppError('Current password is not correct',401));
    }

    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;

    await user.save();

    createSendToken(user, 200, res)
});


