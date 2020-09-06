/**
 * Module dependencies.
 */
var http = require("http");
const express = require('express');
const compression = require('compression');
const session = require('express-session');
const bodyParser = require('body-parser');
const logger = require('morgan');
const chalk = require('chalk');
const errorHandler = require('errorhandler');
const lusca = require('lusca');
const dotenv = require('dotenv');
const MongoStore = require('connect-mongo')(session);
const flash = require('express-flash');
const path = require('path');
const mongoose = require('mongoose');
const passport = require('passport');
const expressStatusMonitor = require('express-status-monitor');
const sass = require('node-sass-middleware');
const multer = require('multer');
var cors = require('cors')
const responseTime = require('response-time');
const https = require("https");
// const redis = require("redis");
// const client = redis.createClient('14115', 'redis-14115.c62.us-east-1-4.ec2.cloud.redislabs.com', {
//   db: 'pagemanagement',
//   password: '123!@#!@',
  
// });

const upload = multer({ 
  dest: path.join(__dirname, 'uploads')
});

/**
 * Load environment variables from .env file, where API keys and passwords are configured.
 */
dotenv.config({ path: '.env.example' });

/**
 * Controllers (route handlers).
 */
const authController = require('./controllers/auth');
const userController = require('./controllers/user');
const apiController = require('./controllers/api');
const contactController = require('./controllers/contact');
const facebookController = require('./controllers/facebook');
const webHookController = require('./controllers/webhook');
const customerController = require('./controllers/customer');
const tagController = require('./controllers/tag');
const productController = require('./controllers/product');
const orderController = require('./controllers/order');
const pageController = require('./controllers/page');

/**
 * API keys and Passport configuration.
 */
const passportConfig = require('./config/passport');
const WebHook = require('./models/WebHook');

/**
 * Create Express server.
 */
const app = express();

/**
 * Connect to MongoDB.
 */
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useNewUrlParser', true);
mongoose.set('useUnifiedTopology', true);
mongoose.connect(process.env.MONGODB_URI);
mongoose.connection.on('error', (err) => {
  console.error(err);
  console.log('%s MongoDB connection error. Please make sure MongoDB is running.', chalk.red('✗'));
  process.exit();
});

/**
 * Express configuration.
 */
app.set('host', process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0');
app.set('port', process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.use(expressStatusMonitor());
app.use(compression());
app.use(sass({
  src: path.join(__dirname, 'public'),
  dest: path.join(__dirname, 'public')
}));
app.use(express.static('uploads'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  resave: true,
  saveUninitialized: true,
  secret: process.env.SESSION_SECRET,
  cookie: { maxAge: 1000*60*30 }, // in milliseconds
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
app.use(lusca.xframe('SAMEORIGIN'));
app.use(lusca.xssProtection(true));
app.disable('x-powered-by');
app.use((req, res, next) => {
  res.locals.user = req.user;
  next();
});
app.use((req, res, next) => {
  // After successful login, redirect back to the intended page
  if (!req.user
    && req.path !== '/login'
    && req.path !== '/signup'
    && !req.path.match(/^\/auth/)
    && !req.path.match(/\./)) {
    req.session.returnTo = req.originalUrl;
  } else if (req.user
    && (req.path === '/account' || req.path.match(/^\/api/))) {
    req.session.returnTo = req.originalUrl;
  }
  next();
});
app.use(cors())
app.use(responseTime());

app.get('/keep-alive', (req, res)=>{
  res.json(true);
});

// Accepts POST requests at /webhook endpoint
app.post('/webhook', webHookController.receivedWebhook);

// Accepts GET requests at the /webhook endpoint
app.get('/webhook', webHookController.verifyWebhook);

/**
 * API examples routes.
 */
app.get('/api', apiController.getApi);
app.get('/api/lob', apiController.getLob);
app.get('/api/upload', lusca({ csrf: true }), apiController.getFileUpload);
app.post('/api/upload', upload.single('myFile'), lusca({ csrf: true }), apiController.postFileUpload);

// Facebook pages
app.get('/api/facebook/pages', passportConfig.isJwtAuthenticated, facebookController.pages);
app.post('/api/facebook/page-setup', passportConfig.isJwtAuthenticated, facebookController.setupPage);
app.get('/api/facebook/threads', passportConfig.isJwtAuthenticated, facebookController.threads);
app.get('/api/facebook/messages', passportConfig.isJwtAuthenticated, facebookController.messages);
app.post('/api/facebook/postMessage', passportConfig.isJwtAuthenticated, facebookController.postMessage);
// app.get('/api/facebook/page', passportConfig.isAuthenticated, passportConfig.isAuthorized, facebookController.messages);


app.post('/api/auth/facebook', authController.facebookLogin);

/**
 * Account
 */
app.post('/api/account/complete-setup', passportConfig.isJwtAuthenticated, userController.postCompleteSetup);
app.get('/api/account/get-setup-status', passportConfig.isJwtAuthenticated, userController.getSetupStatus);

// Page
app.get('/api/pages', passportConfig.isJwtAuthenticated, pageController.getPageList);

// Customer
app.get('/api/customer/:id', passportConfig.isJwtAuthenticated, customerController.getCustomer);
app.put('/api/customer/:id', passportConfig.isJwtAuthenticated, customerController.updateCustomer);
app.get('/api/customer/:id/tags', passportConfig.isJwtAuthenticated, customerController.getCustomerTags);
app.post('/api/customer/:id/tags', passportConfig.isJwtAuthenticated, customerController.updateCustomerTags);

// Tag
app.get('/api/tags', passportConfig.isJwtAuthenticated, tagController.getTagList);
app.get('/api/tags/:id', passportConfig.isJwtAuthenticated, tagController.getTag);
app.post('/api/tags', passportConfig.isJwtAuthenticated, tagController.createTag);
app.put('/api/tags/:id', passportConfig.isJwtAuthenticated, tagController.updateTag);
app.delete('/api/tags/:id', passportConfig.isJwtAuthenticated, tagController.deleteTag);

// Product
app.get('/api/products', passportConfig.isJwtAuthenticated, productController.getProductList);
app.get('/api/products/:id', passportConfig.isJwtAuthenticated, productController.getProduct);
app.post('/api/products', upload.single('image'), passportConfig.isJwtAuthenticated, productController.createProduct);
app.put('/api/products/:id', passportConfig.isJwtAuthenticated, productController.updateProduct);
app.delete('/api/products/:id', passportConfig.isJwtAuthenticated, productController.deleteProduct);

// Order
app.get('/api/orders', passportConfig.isJwtAuthenticated, orderController.getList);
app.get('/api/orders/:id', passportConfig.isJwtAuthenticated, orderController.getDetail);
app.post('/api/orders', passportConfig.isJwtAuthenticated, orderController.create);
app.put('/api/orders/:id', passportConfig.isJwtAuthenticated, orderController.update);


/**
 * Error Handler.
 */
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({success: false, message: err});
});

// Keep server alive
setInterval(function() {
  https.get("https://page-managment-2.herokuapp.com/keep-alive");
}, 300000); // every 5 minutes (300000)

/**
 * Start Express server.
 */
app.listen(app.get('port'), () => {
  console.log('%s App is running at http://localhost:%d in %s mode', chalk.green('✓'), app.get('port'), app.get('env'));
  console.log('  Press CTRL-C to stop\n');
});
module.exports = app;
