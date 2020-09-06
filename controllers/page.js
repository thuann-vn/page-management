const Page = require('../models/Pages');

/**
 * GET /api/pages
 * List of API examples.
 */
exports.getPageList = async (req, res) => {
  const pages = await Page.find({
    user_id: req.user.id
  });
  res.json(pages);
};