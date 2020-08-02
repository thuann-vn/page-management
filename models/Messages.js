const mongoose = require('mongoose');
const messageSchema = new mongoose.Schema({
  id: { type: String, unique: true },
  page_id: String,
  from: Object,
  to: Object,
  unread_count: Number,
  is_subscribed: Boolean,
  message: String,
  created_time: String,
  thread_id: String,
  type: String,
  attachments: {},
  sticker:{},
}, { timestamps: true });

const Message = mongoose.model('Messages', messageSchema);

module.exports = Message;