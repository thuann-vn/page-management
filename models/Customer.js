
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
  note: String,
  note_updated_time: Date
}, { timestamps: false });

customerSchema.set('toJSON', {
  transform: function (doc, ret, options) {
      ret.id = ret._id;
      delete ret._id;
  }
}); 

const Customer = mongoose.model('Customers', customerSchema);
module.exports = Customer;
