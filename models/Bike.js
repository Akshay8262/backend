const mongoose = require('mongoose');

const bikeSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  image: { type: String },
  price: { type: Number, required: true },
  location: { type: String, required: true },
  available: { type: Boolean, default: true },
  hoster: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

module.exports = mongoose.model('Bike', bikeSchema);
