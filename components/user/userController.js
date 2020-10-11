const User = require('./userModel');
const catchAsync = require('../../utils/catchAsync');
const AppError = require('../../utils/appError');

exports.getAllUsers = catchAsync(async (req,res,next) => {
    const users = await User.find();

    res.status(200).json({
        status: 'success',
        results: users.length,
        data: {
          users
        }
    });
});

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach(el => {
    if(allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.updateMe = catchAsync( async (req,res,next) => {
   // create error if user post password data
   if(req.body.password || req.body.passwordConfirm){
     return next(new AppError('Password cannot be updated from this link',400))
   }
   
   const filterBody = filterObj(req.body, "name","email");
   const updatedUser = await User.findByIdAndUpdate(req.user.id, filterBody, {new: true, runValidators:true});
   
   res.status(200).json({
     status:'success',
     user: updatedUser
   });
});

exports.deleteMe = catchAsync(async (req,res,next) => {
  await User.findByIdAndUpdate(req.user.id, {active: false})

  res.status(204).json({
    status:"success",
    message:"Sorry for loosing you"
  })
})
