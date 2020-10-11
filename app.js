const express = require("express");
const morgan = require("morgan");
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const bookRouter = require("./components/book/bookRouter");
const userRouter = require('./components/user/userRouter');
const globalErrorHandler = require('./controllers/errorController');

const AppError = require('./utils/appError');

const app = express();

//set security http headers
app.use(helmet());

// dev log
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// limit request in same api
const limiter = rateLimit({
  max: 100,
  windowMs: 60*60*1000,
  message: 'Too many requests from this ip, please try again in an hour'
});
app.use('/api',limiter);

// body parser
app.use(express.json({ limit:'10kb'}));

// data sanitazation against nosql query injection
app.use(mongoSanitize());

// data sanitization against xss
app.use(xss());

// prevent parameter pollution // check more
app.use(hpp({whitelist:[
  'sort'
]}));
// adding date to request
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  //console.log(req.headers);
  next();
});

app.use("/api/v1/books", bookRouter);
app.use("/api/v1/user", userRouter);

app.all('*', (req,res,next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server`));
});

app.use(globalErrorHandler);

module.exports = app;
