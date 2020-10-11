const express = require("express");
const bookController = require("../book/bookController");
const authController = require("../../controllers/authController");
const router = express.Router();

router
  .route("/top-5-books")
  .get(bookController.getTop5Books, bookController.getAllBooks);

router
  .route("/premium")
  .get(bookController.getPremiumBooks, bookController.getAllBooks);

router
  .route("/")
  .get(authController.protect, bookController.getAllBooks)
  .post(bookController.createBook);

router
  .route("/:id")
  .get(bookController.getBook)
  .patch(bookController.updateBook)
  .delete(authController.protect, authController.restrictTo('admin','author'),bookController.deleteBook);
module.exports = router;
