const bcrypt = require('bcrypt');
const crypto = require('crypto');
const mongoose = require('mongoose');

const webHookSchema = new mongoose.Schema({
  body: Object
}, { timestamps: true });

const WebHook = mongoose.model('WebHook', webHookSchema);

module.exports = WebHook;
