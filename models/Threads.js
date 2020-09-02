
const mongoose = require('mongoose');

const threadSchema = new mongoose.Schema({
  _id: { type: String, unique: true },
  page_id: String,
  customer_id: String,
  snippet: String,
  unread_count: Number,
  participants: {},
  user: {},
  updated_time: String,
  avatar: String
}, { timestamps: false });

const Thread = mongoose.model('Threads', threadSchema);
module.exports = Thread;
