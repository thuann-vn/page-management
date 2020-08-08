const Customer = require('../models/Customer');
const Tag = require('../models/Tags');

/**
 * GET /api/customer/:id
 * List of API examples.
 */
exports.getCustomer = async (req, res) => {
  const { id } = req.params;
  const customer = await Customer.findOne({ id: id, user_id: req.user.id });
  res.json(customer);
};

/**
 * GET /api/customer/:id/tags
 * List of API examples.
 */
exports.getCustomerTags = async (req, res) => {
  const { id } = req.params;
  const customer = await Customer.findOne({ id: id, user_id: req.user.id });
  const tagIds = customer.tags || [];
  if (tagIds && tagIds.length) {
    const tags = await Tag.find({ user_id: req.user.id, _id: { $in: tagIds } }).sort({ createdAt: 1 }).exec();
    res.json(tags);
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
  const customer = await Customer.findOne({ user_id: req.user.id, id });
  var customerTags = [];

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
    customerTags.push(tag._id);
  }
  customer.tags = customerTags;
  customer.save();
  res.json({success: true, data: customerTags});
};