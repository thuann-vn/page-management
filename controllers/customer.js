const Customer = require('../models/Customer');

/**
 * GET /api/customer/:id
 * List of API examples.
 */
exports.getCustomer = async (req, res) => {
  const {id} = req.params;
  const customer = await Customer.findOne({id: id, user_id: req.user.id});
  res.json(customer);
};
