const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');


const userSchema = new mongoose.Schema({
    name:{
        type:String,
        required: [true, 'Name is required'],
    },
    email:{
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        validate: [validator.isEmail, 'Please provide a valid email']
    },
    photo: String,
    role: {
        type: String,
        enum: ["user","author","admin"],
        default: "user"
    },
    password:{
        type: String,
        required: [true, 'Please provide a password'],
        minlength: 8,
        select:false
    },
    passwordConfirm:{
        type: String,
        required: [true, 'please confirm your password'],
        validate: {
            validator: function(el){
                return el === this.password;
            },
            message: "Password are not the same"
        }
    },
    passwordChangesAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    active:{
        type:Boolean,
        default:true,
        select:false
    }
});

userSchema.pre('save',async function(next){
    if(!this.isModified('password')) return next();

    this.password = await bcrypt.hash(this.password, 12);

    this.passwordConfirm = undefined;
    next();
});

userSchema.pre('save', function(next){
    if(!this.isModified('password') || this.isNew) return next();

    this.passwordChangesAt = Date.now() - 1000;
    next();

})

userSchema.methods.correctPassword = async function(receivedPassword, userPassword){
     return await bcrypt.compare(receivedPassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function(JWTTimestamp){
    
    if(this.passwordChangesAt){
        const changeTime = parseInt(this.passwordChangesAt.getTime() / 1000, 10);
        return JWTTimestamp < changeTime;
    }
    return false; //not changed
}

userSchema.pre(/^find/, function(next){
    this.find({active : {$ne: false}});
    next();
});

userSchema.methods.createPasswordResetToken = function(){
    const resetToken = crypto.randomBytes(32).toString('hex');

    this.passwordResetToken =  crypto.createHash('sha256').update(resetToken).digest('hex');

    this.passwordResetExpires = Date.now() + 10*60*1000;
    return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;