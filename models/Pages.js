const bcrypt = require('bcrypt');
const crypto = require('crypto');
const mongoose = require('mongoose');

const pageSchema = new mongoose.Schema({
  userId: String,
  isDefault: Boolean,
  access_token: String,
  long_live_access_token: String,
  category: String,
  name: String,
  id: String,
  tasks: Array
}, { timestamps: true });

const Page = mongoose.model('Pages', pageSchema);

module.exports = Page;
