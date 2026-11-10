const Order = require("../models/Order");
const User = require("../models/User");
const { sendOrderEmail } = require("../utils/emailService");

// Creates one Order document per cart item, but with a shared orderId
exports.createOrder = async (req, res) => {
  try {
    const { items, paymentMethod, address, phone } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "No items in order" });
    }

    const orderId = String(Date.now()); // shared across all items from this checkout
    const userId = req.user?.id || req.user?._id;
    const userDoc = userId ? await User.findById(userId).select("name email").lean() : null;
    const targetEmail = (req.body.email || userDoc?.email || "").trim().toLowerCase();
    const targetName = req.body.name || userDoc?.name || "Valued Customer";

    const createdOrders = await Promise.all(
      items.map(item =>
        Order.create({
          orderId,
          userId: userId || undefined,
          productName: item.name,
          category: item.category,
          image: item.image,
          quantity: Number(item.quantity),
          price: Number(item.price),
          size: item.size,
          address: address,
          phone: phone,
          customerEmail: targetEmail,
          paymentMethod: paymentMethod || "Online Payment",
          status: "Processing"
        })
      )
    );

    const io = req.app.get("io");
    if (io) {
      io.emit("new_order", { orderId, itemsCount: items.length });
    }

    // Trigger confirmation receipt email ONLY to the customer who placed the order
    if (targetEmail) {
      sendOrderEmail({
        orderId,
        items: items.map(item => ({
          productName: item.name,
          size: item.size,
          quantity: Number(item.quantity),
          price: Number(item.price)
        })),
        paymentMethod: paymentMethod || "Online Payment",
        status: "Processing",
        user: { name: targetName, email: targetEmail },
        phone,
        address
      }).catch(emailErr => {
        console.error("[Email Notification Error - Customer Order Placed]:", emailErr.message);
      });
    } else {
      console.warn(`[Order #${orderId}] Skipped confirmation email: No customer email provided or found.`);
    }

    res.json({ message: "Order Placed", orders: createdOrders });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// Retrieves orders specifically belonging to the particular authenticated mail account
exports.getOrders = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const userDoc = await User.findById(userId).select("email name").lean();
    const userEmail = (userDoc?.email || "").trim().toLowerCase();

    // Find all orders that belong to this particular user ID OR to this particular email account!
    const queryConditions = [{ userId }];
    if (userEmail) {
      const emailRegex = new RegExp(`^${userEmail.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");
      queryConditions.push({ customerEmail: emailRegex });

      // Proactively link any unassociated past orders with this email to this user
      await Order.updateMany(
        {
          customerEmail: emailRegex,
          userId: { $in: [null, undefined] }
        },
        { $set: { userId } }
      ).catch(() => {});
    }

    const orders = await Order.find({ $or: queryConditions }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    console.error("getOrders error:", err);
    res.status(500).json({ message: err.message });
  }
};
