
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
  avatar: String,
  next_paging: {},
  last_paging: {}
}, { timestamps: false });

threadSchema.set('toJSON', {
  transform: function (doc, ret, options) {
      ret.id = ret._id;
      delete ret._id;
  }
}); 

threadSchema.index({ page_id: 1 }); 
threadSchema.index({ customer_id: 1 }); 

const Thread = mongoose.model('Threads', threadSchema);
module.exports = Thread;
