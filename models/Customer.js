
const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  _id: { type: String, unique: true },
  name: String,
  email: String,
  avatar: String,
  updated_time: Date,
  user_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  page_id: String,
  snippet: String,
  last_update: String,
  tags: Array,
  phone: String,
  address: String,
  notes: String,
  notes_updated_time: Date
}, { timestamps: true });

customerSchema.set('toJSON', {
  transform: function (doc, ret, options) {
      ret.id = ret._id;
      delete ret._id;
  }
}); 

customerSchema.index({ page_id: 1 }); 
customerSchema.index({ user_id: 1 }); 

const Customer = mongoose.model('Customers', customerSchema);
module.exports = Customer;
