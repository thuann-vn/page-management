const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  id: String,
  pageId: String,
  from: Object,
  to: Object,
  unread_count: Number,
  is_subscribed: Boolean,
  snippet: String,
  created_time: String
}, { timestamps: true });

const Message = mongoose.model('Messages', messageSchema);

module.exports = Message;
