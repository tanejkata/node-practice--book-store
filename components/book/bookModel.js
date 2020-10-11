const mongoose = require("mongoose");
const slugify = require("slugify");

const bookSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "A book must contain a name"],
    unique: true,
    trim: true,
    minlength: [5, "A book name must contain minimum 5 characters."],
    maxlength: [50, "A book name must be maximum of 50 characters"],
  },
  slug: String,
  category: {
    type: String,
    required: [true, "A book must have a category/genre"],
    enum: {
      values: ["comedy", "drama", "horror", "science", "comic", "sci-fi"],
      message: "Category is either: comedy,drama,horror,science,comic,sci-fi",
    },
  },
  price: {
    type: Number,
    required: [true, "A book must have a price"],
  },
  rating: {
    type: Number,
    default: 4,
    min: [1, "Rating must be above 1.0"],
    max: [5, "Rating must be below 5.0"],
  },
  author: {
    type: String,
    required: [true, "A book must have an Author"],
  },
  description: {
    type: String,
    maxlength: [200, "Maximum length of description is 200 characters"],
  },
  image: String,
  publishedDate: {
    type: Date,
    required: [true, "Published Date is Compulsary"],
  },
  createdAt: {
    type: Date,
    default: Date.now(),
    select: false,
  },
  premiumBook: {
    type: Boolean,
    default: false,
  },
});

const Book = mongoose.model("Book", bookSchema);

module.exports = Book;
