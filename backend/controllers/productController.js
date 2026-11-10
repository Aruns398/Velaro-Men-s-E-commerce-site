const Product = require('../models/Product');
const fs = require('fs');
const path = require('path');

exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const { name, price, category, description } = req.body;
    const image = req.file 
      ? '/uploads/' + req.file.filename 
      : (req.body.imageUrl || req.body.image || '');
    
    if (!name || !price || !category || !image) {
      return res.status(400).json({ message: 'Please provide product name, price, category, and an image.' });
    }

    const numPrice = Number(price);
    if (isNaN(numPrice) || numPrice < 0) {
      return res.status(400).json({ message: 'Please provide a valid price.' });
    }

    const product = await Product.create({
      name: name.trim(),
      price: numPrice,
      category: category.trim(),
      image: image.trim(),
      description: description ? description.trim() : ''
    });

    const io = req.app.get("io");
    if (io) {
      io.emit("product_created", product);
      io.emit("products_updated");
    }

    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    // Clean up local image if it was stored in uploads
    if (product.image && product.image.startsWith('/uploads/')) {
      const filePath = path.join(__dirname, '..', product.image);
      fs.unlink(filePath, (err) => {
        if (err && err.code !== 'ENOENT') {
          console.error('Failed to delete product image file:', err.message);
        }
      });
    }

    const io = req.app.get("io");
    if (io) {
      io.emit("product_deleted", { id: req.params.id });
      io.emit("products_updated");
    }

    res.json({ message: 'Product deleted successfully', id: req.params.id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
