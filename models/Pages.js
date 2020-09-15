const bcrypt = require('bcrypt');
const crypto = require('crypto');
const mongoose = require('mongoose');

const pageSchema = new mongoose.Schema({
  _id: { type: String, unique: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isDefault: Boolean,
  access_token: String,
  long_live_access_token: String,
  category: String,
  name: String,
  tasks: Array
}, { timestamps: true });


pageSchema.set('toJSON', {
  transform: function (doc, ret, options) {
      ret.id = ret._id;
      delete ret._id;
  }
}); 

pageSchema.index({ user_id: 1 }); 

const Page = mongoose.model('Pages', pageSchema);

module.exports = Page;
