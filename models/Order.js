const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  order_code: Number,
  page_id: String,
  customer_id: { type: String, ref: 'Customers' },
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
  status: Number,
  payment_status: Number

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
      if(doc.populated('customer_id')){
        ret.customer = ret.customer_id;
        ret.customer_id = ret.customer.id;
      }
      delete ret._id;
  }
}); 

orderSchema.index({ user_id: 1 }); 
orderSchema.index({ customer_id: 1 }); 
orderSchema.index({ page_id: 1 }); 

const Order = mongoose.model('Orders', orderSchema);
module.exports = Order;
