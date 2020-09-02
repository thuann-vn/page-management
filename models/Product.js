const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: String,
  description: String,
  image: String,
  imageObj: {},
  price: Number,
  page_id: String,
  user_id: String
}, { timestamps: true });

const Product = mongoose.model('Products', productSchema);

module.exports = Product;
