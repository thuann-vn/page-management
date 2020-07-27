
const mongoose = require('mongoose');

const threadSchema = new mongoose.Schema({
  threadId: String,
  sticker:{},
  message: String,
  from: {},
  created_time: Date,
  tags: {},
  to: {},
  attachments: {},
  shares: {},
}, { timestamps: false });

const User = mongoose.model('Threads', threadSchema);
module.exports = User;
