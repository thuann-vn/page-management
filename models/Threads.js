
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

const Thread = mongoose.model('Threads', threadSchema);
module.exports = Thread;
