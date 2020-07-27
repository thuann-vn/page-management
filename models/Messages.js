const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  pageId: String,
  from: Object,
  to: Object,
  unread_count: Number,
  participants: Array,
  is_subscribed: Boolean,
  snippet: String,
  updated_time: Date
}, { timestamps: true });

const User = mongoose.model('Messages', messageSchema);

module.exports = User;
