const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  customer_id: String,
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  description: String,
  subtotal: Number,
  discount: Number,
  shipping: Number,
  total: Number,
  products: [
    {
      product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
      quantity: Number,
      price: Number
    }
  ],
  discount_note: String,
  shipping_note: String,
  shipping_code: String,
  note: String,
}, { timestamps: true });


orderSchema.set('toJSON', {
  transform: function (doc, ret, options) {
      ret.id = ret._id;
      delete ret._id;
  }
}); 

const Order = mongoose.model('Orders', orderSchema);
module.exports = Order;
