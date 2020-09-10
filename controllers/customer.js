const Customer = require('../models/Customer');
const Tag = require('../models/Tags');
const CustomerActivity = require('../models/CustomerActivity');
const mongoose = require('mongoose');

/**
 * GET /api/customer/:id
 * Get customer by id
 */
exports.getCustomer = async (req, res) => {
  const { id } = req.params;
  const customer = await Customer.findOne({ _id: id, user_id: mongoose.Types.ObjectId(req.user.id) });
  var result = customer.toJSON();
  //Get tags
  const tagIds = customer.tags || [];
  if (tagIds && tagIds.length) {
    const tags = await Tag.find({ user_id: mongoose.Types.ObjectId(req.user.id), _id: { $in: tagIds } }).sort({ createdAt: 1 }).exec();
    result.tags = customer;
  }

  //Get activities
  const activities = await CustomerActivity.find({ customer_id: id }).sort({createdAt: -1}).exec();
  result.activities = activities;
  
  res.json(result);
};

/**
 * PUT /api/customer/:id
 * Update customer
 */
exports.updateCustomer = async (req, res) => {
  const { id } = req.params;
  const updateFields = req.body;
  const customer = await Customer.findOne({ _id: id, user_id: mongoose.Types.ObjectId(req.user.id) });
  if(updateFields.email){
    customer.email = updateFields.email;
  }
  if(updateFields.phone){
    customer.phone = updateFields.phone;
  }
  if(updateFields.address){
    customer.address = updateFields.address;
  }
  if(updateFields.notes){
    customer.notes = updateFields.notes;
    customer.notes_updated_time = new Date()
  }
  customer.save();
  res.json({success: true});
};

/**
 * GET /api/customer/:id/tags
 * Get customer tags
 */
exports.getCustomerTags = async (req, res) => {
  const { id } = req.params;
  const customer = await Customer.findOne({ _id: id, user_id: mongoose.Types.ObjectId(req.user.id) });
  if(customer){
    const tagIds = customer.tags || [];
    if (tagIds && tagIds.length) {
      const tags = await Tag.find({ user_id: mongoose.Types.ObjectId(req.user.id), _id: { $in: tagIds } }).sort({ createdAt: 1 }).exec();
      res.json(tags);
    }
  }
  res.json([]);
};

/**
 * POST /api/customer/:id/tags
 * Update customer tags
 */
exports.updateCustomerTags = async (req, res) => {
  const { id } = req.params;
  var { tags = [] } = req.body;
  const customer = await Customer.findOne( { _id: id,user_id: mongoose.Types.ObjectId(req.user.id) });
  var customerTags = [];

  //Get have name only
  tags = tags.filter((item)=>item.name);
  for (var i = 0; i < tags.length; i++) {
    var element = tags[i];
    var tag = await Tag.findOne({ name: element.name, user_id: mongoose.Types.ObjectId(req.user.id) });
    if(!tag){
      tag = await Tag.create({
        name: element.name,
        user_id: mongoose.Types.ObjectId(req.user.id)
      });
    }
    customerTags.push(tag._id);
  }
  customer.tags = customerTags;
  customer.save();
  res.json({success: true, data: customerTags});
};

/**
 * POST /api/customer/:id/activities
 * Get customer activities
 */
exports.getCustomerActivities = async (req, res) => {
  const { id } = req.params;
  const activities = await CustomerActivity.find({ customer_id: id });
  res.json({success: true, data: activities});
};