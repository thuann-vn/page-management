
const mongoose = require('mongoose');

const tagSchema = new mongoose.Schema({
  name: String,
  color: String,
  user_id: String,
  position: Number
}, { timestamps: true });

const Tag = mongoose.model('Tags', tagSchema);
module.exports = Tag;
