
const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  _id: { type: String, unique: true },
  name: String,
  email: String,
  avatar: String,
  updated_time: Date,
  user_id: String,
  page_id: String,
  snippet: String,
  last_update: String,
  tags: Array,
  phone: String,
  address: String,
  note: String,
  note_updated_time: Date
}, { timestamps: false });

const Customer = mongoose.model('Customers', customerSchema);
module.exports = Customer;
