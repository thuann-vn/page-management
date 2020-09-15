const mongoose = require('mongoose');
const messageSchema = new mongoose.Schema({
  _id: { type: String, unique: true },
  page_id: String,
  from: Object,
  to: Object,
  unread_count: Number,
  is_subscribed: Boolean,
  message: String,
  created_time: String,
  thread_id: String,
  post_id: String,
  customer_id: String,
  type: String,
  comment_id: String,
  uuid: String,
  attachments: {},
  sticker:{},
}, { timestamps: true });

messageSchema.set('toJSON', {
  transform: function (doc, ret, options) {
      ret.id = ret._id;
      delete ret._id;
  }
}); 

messageSchema.index({ customer_id: 1 }); 
messageSchema.index({ page_id: 1 }); 

const Message = mongoose.model('Messages', messageSchema);

module.exports = Message;