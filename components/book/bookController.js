const Book = require("./bookModel");
const APIFeatures = require("../../utils/apiFeatures");
const catchAsync = require("../../utils/catchAsync");
const ApiFeatures = require("../../utils/apiFeatures");
const { findByIdAndUpdate } = require("./bookModel");

exports.getAllBooks = catchAsync(async (req, res, next) => {
  const features = new ApiFeatures(Book.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .limit();

  const books = await features.query;

  res.status(200).json({
    status: "success",
    numOfResults: books.length,
    data: {
      books: books,
    },
  });
});

exports.getBook = catchAsync(async (req, res, next) => {
  const book = await Book.findById(req.query.id);

  if (!book) {
    res.status(404).json({
      status: "fail",
      message: "book not found",
    });
  }

  res.status(200).json({
    status: "success",
    data: {
      book: book,
    },
  });
});

exports.createBook = catchAsync(async (req, res, next) => {
  const newBook = await Book.create(req.body);

  res.status(201).json({
    status: "success",
    data: {
      book: newBook,
    },
  });
});

exports.updateBook = catchAsync(async (req, res, next) => {
  const features = new APIFeatures(
    Book.findByIdAndUpdate(req.query.id, req.body, {
      new: true,
      runValidators: true,
    }),
    req.query.id
  ).limitFields();
  const book = await features.query;

  if (!book) {
    res.status(404).json({
      status: "fail",
      message: "book not found",
    });
  }

  res.status(201).json({
    status: "success",
    data: {
      book: book,
    },
  });
});

exports.deleteBook = catchAsync(async (req, res, next) => {
  const book = await Book.findByIdAndDelete(req.query.id);

  if (!book) {
    res.status(404).json({
      status: "fail",
      message: "book not found",
    });
  }

  res.status(204).json({
    status: "success",
    data: null,
  });
});

exports.getTop5Books = catchAsync(async (req, res, next) => {
  req.query.limit = "5";
  req.query.sort = "-rating";
  req.query.fields = "name,price,author,rating";
  next();
});

exports.getPremiumBooks = catchAsync(async (req, res, next) => {
  req.query.premium = true;
  next();
});
