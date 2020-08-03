
const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  id: { type: String, unique: true },
  name: String,
  email: String,
  avatar: String,
  updated_time: Date,
}, { timestamps: false });

const Customer = mongoose.model('Customers', customerSchema);
module.exports = Customer;
