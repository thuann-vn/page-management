const Customer = require('../models/Customer');
const Tag = require('../models/Tags');


/**
 * GET /api/tags
 * List of API examples.
 */
exports.getTagList = async (req, res) => {
  var { excludes = '' } = req.query;
  excludes = excludes.split(',');
  const tags = await Tag.find({
    user_id: req.user.id, id: {
      $nin: excludes
    }
  });
  res.json(tags);
};

/**
 * GET /api/tags/:id
 * List of API examples.
 */
exports.getTag = async (req, res) => {
  const { id } = req.params;
  const tag = await Tag.findOne({ id: id, user_id: req.user.id });
  res.json(tag);
};

/**
 * POST /api/tags
 * List of API examples.
 */
exports.createTag = async (req, res) => {
  const { name } = req.body;
  const tag = await Tag.create({ name, user_id: req.user.id });
  res.json(tag);
};

/**
 * PUT /api/tags/:id
 * Update tag
 */
exports.updateTag = async (req, res) => {
  const { id } = req.params;
  const tag = await Tag.findById({ _id: id, user_id: req.user.id });
  if(req.body.color){
    tag.color = req.body.color;
  }
  if(req.body.position){
    tag.position = parseInt(req.body.position);
  }
  tag.save();
  res.json({
    success: true
  });
};

/**
 * DELETE /api/tags/:id
 * Delete tag
 */
exports.deleteTag = async (req, res) => {
  const { id } = req.params;
  Tag.findByIdAndDelete(id , (err) => {
    console.log(err);
    if (err) {
      return res.json({
        success: false,
        message: err
      });
    }

    res.json({
      success: true
    });
  });
};