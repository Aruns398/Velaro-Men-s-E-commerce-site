const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false
  },
  orderId: { type: String, required: true }, // shared across items from same checkout
  productName: { type: String, required: true },
  category: { type: String },
  image: { type: String },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
  size: { type: String },
  address: { type: String, required: true },
  phone: { type: String, required: true },
  customerEmail: { type: String },
  paymentMethod: { type: String, default: "Online Payment" },
  status: { type: String, default: "Processing" }
}, { timestamps: true });

module.exports = mongoose.model("Order", orderSchema);