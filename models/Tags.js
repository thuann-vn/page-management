
const mongoose = require('mongoose');

const tagSchema = new mongoose.Schema({
  name: String,
  color: String,
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  position: Number
}, { timestamps: true });

tagSchema.index({ user_id: 1 }); 

const Tag = mongoose.model('Tags', tagSchema);
module.exports = Tag;
