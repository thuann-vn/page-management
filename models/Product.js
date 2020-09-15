const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: String,
  description: String,
  image: String,
  imageObj: {},
  price: Number,
  page_id: String,
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

productSchema.set('toJSON', {
  transform: function (doc, ret, options) {
      ret.id = ret._id;
      delete ret._id;
  }
}); 

//Index
productSchema.index({ name: 'text' }); 
productSchema.index({ page_id: 1 }); 
productSchema.index({ user_id: 1 }); 

const Product = mongoose.model('Products', productSchema);

module.exports = Product;
