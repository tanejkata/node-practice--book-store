const AppError = require('../utils/appError');

const handleCastErrorDB = err => {
    const message = `Invalid ${err.path}: ${err.value}`;
    return new AppError(message, 400);
};

const handleValidationErrorDB = err => {
    return new AppError(err.category.message,500);
};

const handleDuplicateFieldsDB = err => {
    return new AppError('Duplicate field value. try with another name',400);
};

const handleJWTError = err => {
    return new AppError('Invalid Token.Login again', 401);
};

const handleJWTExpire = err => {
    return new AppError('You session expired.please login again',401);
}

const sendErrorDev = (err,res) => {
    res.status(err.statusCode).json({
        status: err.status,
        error: err,
        message: err.message,
        stack: err.stack
    });
};

const sendErrorProd = (err,res) => {
    if(err.isOperational){
        res.status(err.statusCode).json({
            status: err.status,
            message: err.message
        });
    }else{
        res.status(500).json({
            status:'Error',
            message: 'Something went very wrong!'
        });
    }
};

module.exports = (err,req,res,next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    if(process.env.NODE_ENV === 'development'){
        sendErrorDev(err,res);
    }else if(process.env.NODE_ENV === 'production'){
        let error = {...err};
        if(String(err.stack).startsWith('CastError')) error = handleCastErrorDB(error);
        if(String(err.stack).startsWith('ValidatorError')) error = handleValidationErrorDB(error);
        if(String(err.stack).startsWith('MongoError')) error = handleDuplicateFieldsDB(error);
        if(error.name === 'JsonWebTokenError') error = handleJWTError(error);
        if(error.name === 'TokenExpiredError') error = handleJWTExpire(error);
        sendErrorProd(error, res);
    }
}