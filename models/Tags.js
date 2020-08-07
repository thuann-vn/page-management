
const mongoose = require('mongoose');

const tagSchema = new mongoose.Schema({
  name: { type: String, unique: true },
  color: String,
  user_id: String,
  position: String
}, { timestamps: true });

const Tag = mongoose.model('Tags', tagSchema);
module.exports = Tag;
