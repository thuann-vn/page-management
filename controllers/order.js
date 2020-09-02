const Order = require('../models/Order');
const Tag = require('../models/Tags');
const mongoose = require('mongoose');

/**
 * GET /api/order/:id
 * Get order by id
 */
exports.getOrder = async (req, res) => {
  const { id } = req.params;
  const order = await Order.populate('').findOne({ id: id, user_id: req.user.id });
  res.json(order);
};

/**
 * POST /api/order/:id
 * Create order
 */
exports.createOrder = async (req, res) => {
  var data = req.body;
  data.products = data.products.map((item)=>{
    item.product_id = mongoose.Types.ObjectId(item.product_id);
    delete item._id;
    delete item.id;
    return item;
  });
  const order = new Order({
    ...data,
    user_id: mongoose.Types.ObjectId(req.user.id),
    customer_id: data.customer_id,
  });
  var result = await order.save();
  res.json({success: result, data: result});
};

/**
 * PUT /api/order/:id
 * Update order
 */
exports.updateOrder = async (req, res) => {
  const { id } = req.params;
  const updateFields = req.body;
  const order = await Order.findOne({ id: id, user_id: req.user.id });
  if(updateFields.email){
    order.email = updateFields.email;
  }
  if(updateFields.phone){
    order.phone = updateFields.phone;
  }
  if(updateFields.address){
    order.address = updateFields.address;
  }
  order.save();
  res.json({success: true});
};

/**
 * GET /api/order/:id/tags
 * Get order tags
 */
exports.getOrderTags = async (req, res) => {
  const { id } = req.params;
  const order = await Order.findOne({ id: id, user_id: req.user.id });
  const tagIds = order.tags || [];
  if (tagIds && tagIds.length) {
    const tags = await Tag.find({ user_id: req.user.id, _id: { $in: tagIds } }).sort({ createdAt: 1 }).exec();
    res.json(tags);
  }
  res.json([]);
};

/**
 * POST /api/order/:id/tags
 * Update order tags
 */
exports.updateOrderTags = async (req, res) => {
  const { id } = req.params;
  var { tags = [] } = req.body;
  const order = await Order.findOne({ user_id: req.user.id, id });
  var orderTags = [];

  //Get have name only
  tags = tags.filter((item)=>item.name);
  for (var i = 0; i < tags.length; i++) {
    var element = tags[i];
    var tag = await Tag.findOne({ name: element.name, user_id: req.user.id });
    if(!tag){
      tag = await Tag.create({
        name: element.name,
        user_id: req.user.id
      });
    }
    orderTags.push(tag._id);
  }
  order.tags = orderTags;
  order.save();
  res.json({success: true, data: orderTags});
};