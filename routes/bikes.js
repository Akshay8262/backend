const express = require('express');
const Bike = require('../models/Bike');
const { auth, isHoster, isAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all bikes (public)
router.get('/', async (req, res) => {
  try {
    const bikes = await Bike.find({ available: true }).populate('hoster', 'name');
    res.json(bikes);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get bike by ID (public)
router.get('/:id', async (req, res) => {
  try {
    const bike = await Bike.findById(req.params.id).populate('hoster', 'name');
    if (!bike) {
      return res.status(404).json({ message: 'Bike not found' });
    }
    res.json(bike);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create bike (hoster/admin only)
router.post('/', auth, isHoster, async (req, res) => {
  try {
    const { title, description, image, price, location } = req.body;
    
    const bike = new Bike({
      title,
      description,
      image,
      price,
      location,
      hoster: req.user._id
    });

    await bike.save();
    res.status(201).json(bike);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update bike (owner or admin only)
router.put('/:id', auth, async (req, res) => {
  try {
    const bike = await Bike.findById(req.params.id);
    if (!bike) {
      return res.status(404).json({ message: 'Bike not found' });
    }

    // Check if user is owner or admin
    if (bike.hoster.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const updatedBike = await Bike.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(updatedBike);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete bike (owner or admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const bike = await Bike.findById(req.params.id);
    if (!bike) {
      return res.status(404).json({ message: 'Bike not found' });
    }

    // Check if user is owner or admin
    if (bike.hoster.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await Bike.findByIdAndDelete(req.params.id);
    res.json({ message: 'Bike deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get bikes by hoster
router.get('/hoster/:hosterId', async (req, res) => {
  try {
    const bikes = await Bike.find({ hoster: req.params.hosterId }).populate('hoster', 'name');
    res.json(bikes);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router; 