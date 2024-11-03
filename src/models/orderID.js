const mongoose = require('mongoose');

const orderIDSchema = new mongoose.Schema({
  userId: { type: Number, ref: 'CartItem', required: true }, // Assuming you have a User model
  id:{
    type: String,
    required: true
  }
});

module.exports = mongoose.model('OrderID', orderIDSchema);
