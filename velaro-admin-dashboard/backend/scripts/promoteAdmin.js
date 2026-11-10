const mongoose = require("mongoose");
require("dotenv").config();
const User = require("../models/User");

async function promote() {
  const email = process.argv[2];
  if (!email) throw new Error("Usage: npm run promote-admin -- account@example.com");
  await mongoose.connect(process.env.MONGO_URI);
  const user = await User.findOneAndUpdate({ email: email.trim().toLowerCase() }, { $set: { role: "admin" } }, { new: true });
  if (!user) throw new Error("No existing account found. Register the account first, then promote it.");
  console.log(`Administrator access enabled for ${user.email}`);
}

promote().catch((error) => { console.error(error.message); process.exitCode = 1; }).finally(() => mongoose.disconnect());
