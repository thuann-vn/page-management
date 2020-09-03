const Order = require('../models/Order');
const mongoose = require('mongoose');

exports.getNextOrderId =  async (userId)=>{
    var lastOrder = await Order.findOne({user_id: mongoose.Types.ObjectId(userId)}).sort({order_code: -1}).limit(1);
    if(lastOrder){
        return lastOrder.order_code  + 1
    }
    return 10001;
}

module.exports.OrderService = exports;