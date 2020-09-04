const CustomerActivity = require('../models/CustomerActivity');
const mongoose = require('mongoose');

exports.addCustomerActivity =  async (customer_id, action, data)=>{
    const activity = new CustomerActivity({
        customer_id,
        action,
        data
    })
    activity.save();
}

module.exports.CustomerService = exports;