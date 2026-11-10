const Order = require("../models/Order");
const User = require("../models/User");
const Appointment = require("../models/Appointment");
const { sendOrderEmail, sendAppointmentEmail } = require("../utils/emailService");

const asyncRoute = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const safePattern = (value) => String(value || "").slice(0, 80).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const pageOptions = (req) => ({
  page: Math.max(1, Number.parseInt(req.query.page, 10) || 1),
  limit: Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 20))
});

exports.overview = asyncRoute(async (req, res) => {
  const now = new Date();
  const start = req.query.from ? new Date(req.query.from) : new Date(now.getFullYear(), now.getMonth(), 1);
  const end = req.query.to ? new Date(req.query.to) : now;
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
    return res.status(400).json({ message: "Choose a valid date range" });
  }
  const dateMatch = { createdAt: { $gte: start, $lte: end } };
  const [orders, customers, appointments, allOrders, statusCounts, daily] = await Promise.all([
    Order.aggregate([
      { $match: dateMatch },
      { $group: { _id: "$orderId", createdAt: { $min: "$createdAt" }, value: { $sum: { $multiply: ["$price", "$quantity"] } }, status: { $first: "$status" } } },
      { $sort: { createdAt: -1 } }
    ]),
    User.countDocuments(dateMatch),
    Appointment.countDocuments(dateMatch),
    Order.aggregate([{ $group: { _id: "$orderId", value: { $sum: { $multiply: ["$price", "$quantity"] } }, status: { $first: "$status" } } }]),
    Order.aggregate([{ $group: { _id: "$status", orderIds: { $addToSet: "$orderId" }, value: { $sum: { $multiply: ["$price", "$quantity"] } } } }]),
    Order.aggregate([
      { $match: dateMatch },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, orderIds: { $addToSet: "$orderId" }, value: { $sum: { $multiply: ["$price", "$quantity"] } } } },
      { $sort: { _id: 1 } }
    ])
  ]);
  const recent = await Order.aggregate([
    { $match: dateMatch },
    { $sort: { createdAt: -1 } },
    { $group: { _id: "$orderId", createdAt: { $first: "$createdAt" }, status: { $first: "$status" }, customerId: { $first: "$userId" }, value: { $sum: { $multiply: ["$price", "$quantity"] } }, itemCount: { $sum: 1 } } },
    { $sort: { createdAt: -1 } }, { $limit: 8 },
    { $lookup: { from: "users", localField: "customerId", foreignField: "_id", as: "customer" } },
    { $project: { orderId: "$_id", _id: 0, createdAt: 1, status: 1, value: 1, itemCount: 1, customer: { $ifNull: [{ $arrayElemAt: ["$customer.name", 0] }, "Guest"] } } }
  ]);
  res.json({
    range: { from: start, to: end },
    summary: {
      orders: orders.length,
      orderValue: orders.reduce((sum, order) => sum + order.value, 0),
      customers,
      appointments,
      pendingOrders: orders.filter((order) => ["Pending", "Processing"].includes(order.status)).length,
      totalCustomers: await User.countDocuments({ role: { $ne: "admin" } }),
      totalAppointments: await Appointment.countDocuments(),
      allOrderCount: allOrders.length,
      allOrderValue: allOrders.reduce((sum, order) => sum + order.value, 0)
    },
    orderStatuses: statusCounts,
    daily: daily.map((row) => ({ date: row._id, orders: row.orderIds.length, orderValue: row.value })),
    recentOrders: recent
  });
});

exports.listOrders = asyncRoute(async (req, res) => {
  const { page, limit } = pageOptions(req);
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.search) filter.$or = [
    { orderId: { $regex: safePattern(req.query.search), $options: "i" } },
    { productName: { $regex: safePattern(req.query.search), $options: "i" } },
    { phone: { $regex: safePattern(req.query.search), $options: "i" } }
  ];
  const [items, total] = await Promise.all([Order.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).populate("userId", "name email").lean(), Order.countDocuments(filter)]);
  res.json({ items, page, limit, total });
});

exports.updateOrder = asyncRoute(async (req, res) => {
  const allowed = ["Pending", "Processing", "Shipped", "Delivered", "Cancelled", "Refunded"];
  if (!allowed.includes(req.body.status)) return res.status(400).json({ message: "Invalid order status" });
  const result = await Order.updateMany({ orderId: req.params.orderId }, { $set: { status: req.body.status } });
  if (!result.matchedCount) return res.status(404).json({ message: "Order not found" });

  // Send automated email receipt notification to the customer
  try {
    const orders = await Order.find({ orderId: req.params.orderId }).populate("userId", "name email").lean();
    if (orders && orders.length > 0) {
      const first = orders[0];
      const customerEmail = first.customerEmail || first.userId?.email;
      sendOrderEmail({
        orderId: req.params.orderId,
        items: orders.map((o) => ({
          productName: o.productName,
          size: o.size,
          quantity: o.quantity,
          price: o.price
        })),
        paymentMethod: first.paymentMethod,
        status: req.body.status,
        user: { name: first.userId?.name || "Valued Customer", email: customerEmail },
        phone: first.phone,
        address: first.address
      }).catch((emailErr) => {
        console.error("[Email Notification Error - Admin Order Update]:", emailErr.message);
      });
    }
  } catch (err) {
    console.error("[Email Notification Error - Fetching Order]:", err.message);
  }

  res.json({ message: "Order status updated", status: req.body.status });
});

exports.listCustomers = asyncRoute(async (req, res) => {
  const { page, limit } = pageOptions(req);
  const filter = { role: { $ne: "admin" } };
  if (req.query.search) filter.$or = [
    { name: { $regex: safePattern(req.query.search), $options: "i" } },
    { email: { $regex: safePattern(req.query.search), $options: "i" } }
  ];
  const [items, total] = await Promise.all([
    User.find(filter).select("name email createdAt").sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    User.countDocuments(filter)
  ]);
  res.json({ items, page, limit, total });
});

exports.listAppointments = asyncRoute(async (req, res) => {
  const { page, limit } = pageOptions(req);
  const filter = {};
  if (req.query.status) {
    if (req.query.status === "Pending") {
      filter.$or = [{ status: "Pending" }, { status: { $exists: false } }, { status: null }];
    } else {
      filter.status = req.query.status;
    }
  }
  if (req.query.search) {
    const searchFilter = [
      { name: { $regex: safePattern(req.query.search), $options: "i" } },
      { email: { $regex: safePattern(req.query.search), $options: "i" } },
      { phone: { $regex: safePattern(req.query.search), $options: "i" } },
      { service: { $regex: safePattern(req.query.search), $options: "i" } }
    ];
    if (filter.$or) {
      filter.$and = [{ $or: filter.$or }, { $or: searchFilter }];
      delete filter.$or;
    } else {
      filter.$or = searchFilter;
    }
  }
  const [items, total] = await Promise.all([
    Appointment.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Appointment.countDocuments(filter)
  ]);
  res.json({ items, page, limit, total });
});

exports.updateAppointment = asyncRoute(async (req, res) => {
  const allowed = ["Pending", "Confirmed", "Completed", "Cancelled"];
  const update = {};
  if (req.body.status !== undefined) {
    if (!allowed.includes(req.body.status)) return res.status(400).json({ message: "Invalid appointment status" });
    update.status = req.body.status;
  }
  if (req.body.adminNote !== undefined) update.adminNote = String(req.body.adminNote).slice(0, 1000);
  const item = await Appointment.findByIdAndUpdate(req.params.id, { $set: update }, { new: true, runValidators: true });
  if (!item) return res.status(404).json({ message: "Appointment not found" });

  // Send automated email receipt notification when appointment status is updated
  if (req.body.status) {
    sendAppointmentEmail({
      appointment: item,
      status: item.status
    }).catch((emailErr) => {
      console.error("[Email Notification Error - Admin Appointment Update]:", emailErr.message);
    });
  }

  res.json(item);
});

exports.adminProfile = asyncRoute(async (req, res) => {
  const user = await User.findById(req.user.id).select("name email role").lean();
  if (!user || user.role !== "admin") return res.status(403).json({ message: "Administrator access required" });
  res.json(user);
});

exports.analytics = asyncRoute(async (req, res) => {
  const now = new Date();
  let start, end;
  if (req.query.from && req.query.to) {
    start = new Date(req.query.from);
    end = new Date(req.query.to);
  } else if (req.query.range === "all") {
    start = new Date("2020-01-01T00:00:00.000Z");
    end = now;
  } else if (req.query.range === "fy") {
    const currentYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
    start = new Date(currentYear, 3, 1);
    end = new Date(currentYear + 1, 2, 31, 23, 59, 59);
  } else {
    const days = Number(req.query.range) || 30;
    start = new Date();
    start.setDate(start.getDate() - days);
    start.setHours(0, 0, 0, 0);
    end = now;
  }

  const dateMatch = { createdAt: { $gte: start, $lte: end } };

  const [orderItems, totalCustomers, newCustomers, totalAppointments, appointmentsInRange] = await Promise.all([
    Order.find(dateMatch).populate("userId", "name email").sort({ createdAt: -1 }).lean(),
    User.countDocuments({ role: { $ne: "admin" } }),
    User.countDocuments(dateMatch),
    Appointment.countDocuments(),
    Appointment.countDocuments(dateMatch)
  ]);

  const orderMap = new Map();
  const categoryMap = new Map();
  const statusMap = new Map();
  const paymentMap = new Map();
  const productMap = new Map();
  const monthlyMap = new Map();
  const dailyMap = new Map();

  let grossRevenue = 0;
  let deliveredRevenue = 0;
  let cancelledRevenue = 0;
  let totalUnits = 0;

  for (const item of orderItems) {
    const lineTotal = (item.price || 0) * (item.quantity || 1);
    grossRevenue += lineTotal;
    totalUnits += item.quantity || 1;

    if (item.status === "Delivered") {
      deliveredRevenue += lineTotal;
    } else if (item.status === "Cancelled" || item.status === "Refunded") {
      cancelledRevenue += lineTotal;
    }

    if (!orderMap.has(item.orderId)) {
      orderMap.set(item.orderId, {
        orderId: item.orderId,
        createdAt: item.createdAt,
        customerName: item.userId?.name || "Guest",
        customerEmail: item.customerEmail || item.userId?.email || "—",
        phone: item.phone || "—",
        address: item.address || "—",
        status: item.status || "Processing",
        paymentMethod: item.paymentMethod || "Online Payment",
        itemsCount: 0,
        totalValue: 0,
        items: []
      });
    }
    const grp = orderMap.get(item.orderId);
    grp.itemsCount += item.quantity || 1;
    grp.totalValue += lineTotal;
    grp.items.push({
      productName: item.productName,
      category: item.category || "Apparel",
      price: item.price,
      quantity: item.quantity,
      size: item.size
    });

    const cat = item.category || "Apparel";
    const catData = categoryMap.get(cat) || { name: cat, value: 0, units: 0 };
    catData.value += lineTotal;
    catData.units += item.quantity || 1;
    categoryMap.set(cat, catData);

    const prodKey = item.productName || "Unknown Product";
    const prodData = productMap.get(prodKey) || { name: prodKey, category: cat, revenue: 0, units: 0 };
    prodData.revenue += lineTotal;
    prodData.units += item.quantity || 1;
    productMap.set(prodKey, prodData);

    const st = item.status || "Processing";
    const stData = statusMap.get(st) || { name: st, count: 0, value: 0 };
    stData.count += 1;
    stData.value += lineTotal;
    statusMap.set(st, stData);

    const pm = item.paymentMethod || "Online Payment";
    const pmData = paymentMap.get(pm) || { name: pm, count: 0, value: 0 };
    pmData.count += 1;
    pmData.value += lineTotal;
    paymentMap.set(pm, pmData);

    const itemDate = new Date(item.createdAt);
    const mKey = `${itemDate.getFullYear()}-${String(itemDate.getMonth() + 1).padStart(2, "0")}`;
    const mName = itemDate.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
    const mData = monthlyMap.get(mKey) || { monthKey: mKey, month: mName, gross: 0, taxable: 0, tax: 0, orders: 0, units: 0 };
    mData.gross += lineTotal;
    mData.units += item.quantity || 1;
    monthlyMap.set(mKey, mData);

    const dKey = itemDate.toISOString().slice(0, 10);
    const dData = dailyMap.get(dKey) || { date: dKey, revenue: 0, orders: 0 };
    dData.revenue += lineTotal;
    dailyMap.set(dKey, dData);
  }

  for (const ord of orderMap.values()) {
    const oDate = new Date(ord.createdAt);
    const mKey = `${oDate.getFullYear()}-${String(oDate.getMonth() + 1).padStart(2, "0")}`;
    if (monthlyMap.has(mKey)) {
      monthlyMap.get(mKey).orders += 1;
    }
    const dKey = oDate.toISOString().slice(0, 10);
    if (dailyMap.has(dKey)) {
      dailyMap.get(dKey).orders += 1;
    }
  }

  const gstRate = 0.18;
  const taxableTurnover = Math.round((grossRevenue / (1 + gstRate)) * 100) / 100;
  const taxCollected = Math.round((grossRevenue - taxableTurnover) * 100) / 100;
  const cgst = Math.round((taxCollected / 2) * 100) / 100;
  const sgst = Math.round((taxCollected / 2) * 100) / 100;

  const monthlyArray = Array.from(monthlyMap.values())
    .sort((a, b) => a.monthKey.localeCompare(b.monthKey))
    .map((m) => {
      const taxable = Math.round((m.gross / (1 + gstRate)) * 100) / 100;
      const tax = Math.round((m.gross - taxable) * 100) / 100;
      return {
        ...m,
        taxable,
        tax,
        cgst: Math.round((tax / 2) * 100) / 100,
        sgst: Math.round((tax / 2) * 100) / 100
      };
    });

  const dailyArray = Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date));
  const categoryArray = Array.from(categoryMap.values()).sort((a, b) => b.value - a.value);
  const statusArray = Array.from(statusMap.values()).sort((a, b) => b.value - a.value);
  const paymentArray = Array.from(paymentMap.values()).sort((a, b) => b.value - a.value);
  const topProducts = Array.from(productMap.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 10);

  const distinctOrders = Array.from(orderMap.values());
  const aov = distinctOrders.length ? Math.round(grossRevenue / distinctOrders.length) : 0;

  res.json({
    dateRange: { from: start, to: end },
    taxSummary: {
      financialYear: `${start.getFullYear()}-${end.getFullYear()}`,
      gstRatePercent: 18,
      grossRevenue,
      taxableTurnover,
      taxCollected,
      cgst,
      sgst,
      igst: 0,
      deliveredRevenue,
      cancelledRevenue,
      totalOrders: distinctOrders.length,
      totalUnits,
      averageOrderValue: aov,
      totalCustomers,
      newCustomers,
      totalAppointments,
      appointmentsInRange
    },
    monthly: monthlyArray,
    daily: dailyArray,
    categories: categoryArray,
    statuses: statusArray,
    paymentMethods: paymentArray,
    topProducts,
    orders: distinctOrders
  });
});
