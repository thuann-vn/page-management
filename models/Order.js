const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  order_code: Number,
  customer_id: String,
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  description: String,
  subtotal: Number,
  discount: Number,
  shipping: Number,
  total: Number,
  products: [
    {
      product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Products' },
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
      if(ret.products){
        ret.products = ret.products.map((detail)=>{
          var productData = detail.product_id;
          return {
            ...productData,
            ...detail,
            product_id: productData ? productData.id : null,
          }
        })
      }
      delete ret._id;
  }
}); 

const Order = mongoose.model('Orders', orderSchema);
module.exports = Order;
