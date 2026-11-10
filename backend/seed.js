const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const User = require("./models/User");

const seedUser = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected for seeding...");

    // Check if user already exists
    const existingUser = await User.findOne({ email: "arun123@gmail.com" });
    if (existingUser) {
      console.log("User arun123@gmail.com already exists! Skipping seed.");
      process.exit(0);
    }

    // Create default user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("12345", salt);

    await User.create({
      name: "Arun",
      email: "arun123@gmail.com",
      password: hashedPassword
    });

    console.log("Default user created successfully!");
    console.log("  Email:    arun123@gmail.com");
    console.log("  Password: 12345");
    process.exit(0);
  } catch (error) {
    console.error("Seed error:", error.message);
    process.exit(1);
  }
};

seedUser();
