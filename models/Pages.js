const bcrypt = require('bcrypt');
const crypto = require('crypto');
const mongoose = require('mongoose');

const pageSchema = new mongoose.Schema({
  userId: String,
  isDefault: Boolean,
  access_token: String,
  category: String,
  name: String,
  id: String,
  tasks: Array
}, { timestamps: true });

/**
 * Password hash middleware.
 */
pageSchema.pre('save', function save(next) {
  const user = this;
  if (!user.isModified('password')) { return next(); }
  bcrypt.genSalt(10, (err, salt) => {
    if (err) { return next(err); }
    bcrypt.hash(user.password, salt, (err, hash) => {
      if (err) { return next(err); }
      user.password = hash;
      next();
    });
  });
});

const Page = mongoose.model('Pages', pageSchema);

module.exports = Page;
