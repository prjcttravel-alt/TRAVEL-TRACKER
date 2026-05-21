const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/auth');

// All admin routes require authentication and admin role
router.use(protect);
router.use(adminOnly);

// Define API routes for Admin Dashboard

// Booking Analytics
router.get('/bookings', adminController.getBookings);
router.get('/bookings/monthly', adminController.getMonthlyBookings);
router.get('/bookings/yearly', adminController.getYearlyBookings);

// Revenue Analytics
router.get('/revenue', adminController.getRevenue);
router.get('/revenue/tripwise', adminController.getTripwiseRevenue);

// Active Trips & Actions
router.get('/active-trips', adminController.getActiveTrips);
router.put('/trips/complete/:tripId', adminController.completeTrip);

// Payments
router.get('/payments', adminController.getPayments);
router.get('/payments/pending', adminController.getPendingPayments);
router.get('/payments/paid', adminController.getPaidPayments);

// Search Analytics
router.get('/searches', adminController.getSearches);
router.get('/most-searched', adminController.getMostSearched);

// Dashboard Summary
router.get('/summary', adminController.getDashboardSummary);

// User Management
router.get('/users', adminController.getUsersWithBookings);
router.put('/users/:id/block', adminController.blockUser);
router.delete('/users/:id', adminController.deleteUser);

// Cancellation Analytics
router.get('/cancellations', adminController.getCancellations);
router.get('/cancellations/stats', adminController.getCancellationStats);

module.exports = router;
