const express = require('express');
const Booking = require('../models/Booking');
const Bike = require('../models/Bike');
const { auth, isAdmin } = require('../middleware/auth');

const router = express.Router();

// Create booking (user only)
router.post('/', auth, async (req, res) => {
  try {
    const { bikeId, startDate, endDate } = req.body;

    // Check if bike exists and is available
    const bike = await Bike.findById(bikeId);
    if (!bike) {
      return res.status(404).json({ message: 'Bike not found' });
    }
    if (!bike.available) {
      return res.status(400).json({ message: 'Bike is not available' });
    }

    // Calculate total price (simple calculation)
    const days = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24));
    const totalPrice = bike.price * days;

    const booking = new Booking({
      user: req.user._id,
      bike: bikeId,
      startDate,
      endDate,
      totalPrice
    });

    await booking.save();

    // Update bike availability
    await Bike.findByIdAndUpdate(bikeId, { available: false });

    res.status(201).json(booking);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user's bookings
router.get('/my-bookings', auth, async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate('bike')
      .populate('user', 'name');
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get bookings for hoster's bikes
router.get('/hoster-bookings', auth, async (req, res) => {
  try {
    const bikes = await Bike.find({ hoster: req.user._id });
    const bikeIds = bikes.map(bike => bike._id);
    
    const bookings = await Booking.find({ bike: { $in: bikeIds } })
      .populate('bike')
      .populate('user', 'name');
    
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all bookings (admin only)
router.get('/all', auth, isAdmin, async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('bike')
      .populate('user', 'name');
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update booking status
router.put('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const booking = await Booking.findById(req.params.id).populate('bike');
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if user is authorized (booking owner, bike hoster, or admin)
    const isOwner = booking.user.toString() === req.user._id.toString();
    const isHoster = booking.bike.hoster.toString() === req.user._id.toString();
    const isAdminUser = req.user.role === 'admin';

    if (!isOwner && !isHoster && !isAdminUser) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    booking.status = status;
    await booking.save();

    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Cancel booking
router.delete('/:id', auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if user is booking owner or admin
    if (booking.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Update bike availability
    await Bike.findByIdAndUpdate(booking.bike, { available: true });
    
    await Booking.findByIdAndDelete(req.params.id);
    res.json({ message: 'Booking cancelled successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router; 