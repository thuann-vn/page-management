
const mongoose = require('mongoose');

const threadSchema = new mongoose.Schema({
  id: { type: String, unique: true },
  snippet: String,
  participants: {},
  updated_time: String
}, { timestamps: false });

const Thread = mongoose.model('Threads', threadSchema);
module.exports = Thread;
