const bcrypt = require('bcrypt');
const crypto = require('crypto');
const mongoose = require('mongoose');

const pageSchema = new mongoose.Schema({
  _id: { type: String, unique: true },
  user_id: String,
  isDefault: Boolean,
  access_token: String,
  long_live_access_token: String,
  category: String,
  name: String,
  tasks: Array
}, { timestamps: true });

const Page = mongoose.model('Pages', pageSchema);

module.exports = Page;
