const Order = require('../models/Order');
const Tag = require('../models/Tags');
const mongoose = require('mongoose');
const { getNextOrderId, OrderService } = require('../services/order');
const { CustomerService } = require('../services/customer');
const CustomerActivities = require('../models/CustomerActivity');
const { CustomerActionTypes } = require('../constants');
const { pusher } = require('../services/pusher');

/**
 * GET /api/orders/:id
 * Get order by id
 */
exports.getDetail = async (req, res) => {
  const { id } = req.params;
  const order = await Order.populate('').findOne({ id: id, user_id: req.user.id });
  res.json(order);
};

/**
 * POST /api/orders
 * Create order
 */
exports.create = async (req, res) => {
  var data = req.body;

  //Validate data
  if(!data.customer_id){
    res.json({success: false, message: 'Please select customer'});
  }

  if(!data.products  || !data.products.length){
    res.json({success: false, message: 'Invalid Products'});
  }

  if(!data.subtotal || data.subtotal < 0 || data.discount < 0 || data.shipping < 0 || data.total < 0){
    res.json({success: false, message: 'Invalid Input'});
  }

  data.products = data.products.map((item)=>{
    item.product_id = mongoose.Types.ObjectId(item.product_id);
    delete item._id;
    delete item.id;
    return item;
  });
  const order = new Order({
    ...data,
    order_code: await OrderService.getNextOrderId(req.user.id),
    user_id: mongoose.Types.ObjectId(req.user.id),
    customer_id: data.customer_id,
  });
  var result = await order.save();

  //Save customer service
  CustomerService.addCustomerActivity(data.customer_id, CustomerActionTypes.CREATED_ORDER, {id: result._id, total: result.total})
  pusher.trigger('notifications_'  + req.user_id, 'order.new', { order: result });

  res.json({success: result, data: result});
};

/**
 * PUT /api/orders/:id
 * Update order
 */
exports.update = async (req, res) => {
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
 * GET /api/orders
 * Get order tags
 */
exports.getList = async (req, res) => {
  const { customer_id } = req.query;
  const conditions = { customer_id: customer_id, user_id: mongoose.Types.ObjectId(req.user.id) }

  const orders = await Order.find(conditions).populate('products.product_id');
  res.json(orders);
};

/**
 * POST /api/orders/:id/tags
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