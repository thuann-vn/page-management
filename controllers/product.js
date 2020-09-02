const Product = require('../models/Product');
/**
 * GET /api/products
 * List of API examples.
 */
exports.getProductList = async (req, res) => {
  var { q = '' } = req.query;
  var conditions = {
    user_id: req.user.id
  }
  if(q){
    conditions['$text'] = { $search: q }
  }
  console.log(conditions);
  const products = await Product.find(conditions);
  res.json({success: true, data: products});
};

/**
 * GET /api/products/:id
 * List of API examples.
 */
exports.getProduct = async (req, res) => {
  const { id } = req.params;
  const product = await Product.findOne({ _id: id, user_id: req.user.id });
  res.json(product);
};

/**
 * POST /api/products
 * List of API examples.
 */
exports.createProduct = async (req, res) => {
  console.log(req.file);
  const { name, description, price } = req.body;
  var productData = { name, description, price, user_id: req.user.id };
  if(req.file){
    productData.imageObj = req.file;
    productData.image = req.file.filename;
  }
  const product = await Product.create(productData);
  res.json({success: true, data: product});
};

/**
 * PUT /api/products/:id
 * Update product
 */
exports.updateProduct = async (req, res) => {
  const { id } = req.params;
  const product = await Product.findById({ _id: id, user_id: req.user.id });
  if(req.body.color){
    product.color = req.body.color;
  }
  if(req.body.position){
    product.position = parseInt(req.body.position);
  }
  product.save();
  res.json({
    success: true
  });
};

/**
 * DELETE /api/products/:id
 * Delete product
 */
exports.deleteProduct = async (req, res) => {
  const { id } = req.params;
  Product.findByIdAndDelete(id , (err) => {
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