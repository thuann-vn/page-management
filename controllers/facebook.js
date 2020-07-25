const graph = require('fbgraph');
const Quickbooks = require('node-quickbooks');
const passport = require('passport');

Quickbooks.setOauthVersion('2.0');

/**
 * GET /api/facebook
 * Facebook API example.
 */
exports.messages = async (req, res, next) => {
  res.render('facebook/page', {
    title: 'Messages'
  });
};