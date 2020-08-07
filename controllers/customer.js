const Customer = require('../models/Customer');
const Tag = require('../models/Tags');

/**
 * GET /api/customer/:id
 * List of API examples.
 */
exports.getCustomer = async (req, res) => {
  const {id} = req.params;
  const customer = await Customer.findOne({id: id, user_id: req.user.id});
  res.json(customer);
};

/**
 * GET /api/customer/:id/tags
 * List of API examples.
 */
exports.getCustomerTags = async (req, res) => {
  const {id} = req.params;
  const customer = await Customer.findOne({id: id, user_id: req.user.id});
  const tagIds = customer.tags || [];
  if(tagIds && tagIds.length){
    const tags = await Tag.find({user_id: req.user.id, _id: {$in: tagIds}});
    res.json(tags);
  }
  res.json([]);
};
