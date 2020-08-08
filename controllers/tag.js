const Customer = require('../models/Customer');
const Tag = require('../models/Tags');


/**
 * GET /api/tags
 * List of API examples.
 */
exports.getTagList = async (req, res) => {
  var {excludes = ''} = req.query;
  excludes = excludes.split(',');
  const tags = await Tag.find({user_id: req.user.id, id: {
    $nin: excludes
  }});
  res.json(tags);
};

/**
 * GET /api/tags/:id
 * List of API examples.
 */
exports.getTag = async (req, res) => {
  const {id} = req.params;
  const tag = await Tag.findOne({id: id, user_id: req.user.id});
  res.json(tag);
};

/**
 * POST /api/tags
 * List of API examples.
 */
exports.createTag = async (req, res) => {
  const {name} = req.body;
  const tag = await Tag.create({name, user_id: req.user.id});
  res.json(tag);
};
