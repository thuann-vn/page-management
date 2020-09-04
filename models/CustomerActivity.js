
const mongoose = require('mongoose');
const customerActivitySchema = new mongoose.Schema({
  customer_id: { type: String, ref: 'Customer' },
  action: String,
  description: String,
  data: {}
}, { timestamps: true });

customerActivitySchema.set('toJSON', {
  transform: function (doc, ret, options) {
      ret.id = ret._id;
      delete ret._id;
  }
}); 

const CustomerActivities = mongoose.model('CustomerActivities', customerActivitySchema);
module.exports = CustomerActivities;
