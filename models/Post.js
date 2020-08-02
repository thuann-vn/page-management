const mongoose = require('mongoose');
const postSchema = new mongoose.Schema({
  id: { type: String, unique: true },
  page_id: String,
  message: String,
  created_time: String,
  type: String,
  attachments: {},
}, { timestamps: true });

const Post = mongoose.model('Posts', postSchema);

module.exports = Post;