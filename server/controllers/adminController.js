const User = require('../models/User');
const Booking = require('../models/Booking');
const Event = require('../models/Event');
const Payment = require('../models/Payment');
const Cancellation = require('../models/Cancellation');
const Search = require('../models/Search');
const TripHistory = require('../models/TripHistory');
const Analytics = require('../models/Analytics');

// --- Booking Analytics ---
exports.getBookings = async (req, res) => {
  try {
    const bookings = await Booking.find().populate('user', 'name email').populate('event', 'eventTitle');
    res.status(200).json({ success: true, count: bookings.length, data: bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getMonthlyBookings = async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();
    const monthlyData = await Booking.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(`${currentYear}-01-01`),
            $lte: new Date(`${currentYear}-12-31`)
          }
        }
      },
      {
        $group: {
          _id: { $month: "$createdAt" },
          totalBookings: { $sum: 1 },
          totalRevenue: { $sum: "$totalPrice" }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    res.status(200).json({ success: true, data: monthlyData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getYearlyBookings = async (req, res) => {
  try {
    const yearlyData = await Booking.aggregate([
      {
        $group: {
          _id: { $year: "$createdAt" },
          totalBookings: { $sum: 1 },
          totalRevenue: { $sum: "$totalPrice" }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    res.status(200).json({ success: true, data: yearlyData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- Revenue Analytics ---
exports.getRevenue = async (req, res) => {
  try {
    const revenue = await Booking.aggregate([
      { $match: { status: 'confirmed' } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } }
    ]);
    res.status(200).json({ success: true, data: revenue[0] ? revenue[0].total : 0 });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getTripwiseRevenue = async (req, res) => {
  try {
    const tripRevenue = await Booking.aggregate([
      { $match: { status: 'confirmed' } },
      { $group: { _id: "$event", revenue: { $sum: "$totalPrice" }, bookings: { $sum: 1 } } },
      { $lookup: { from: 'events', localField: '_id', foreignField: '_id', as: 'tripDetails' } },
      { $unwind: "$tripDetails" },
      { $project: { _id: 1, tripName: "$tripDetails.eventTitle", revenue: 1, bookings: 1 } },
      { $sort: { revenue: -1 } }
    ]);
    res.status(200).json({ success: true, data: tripRevenue });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- Active Trips ---
exports.getActiveTrips = async (req, res) => {
  try {
    const activeTrips = await Event.find({ eventStatus: { $in: ['Ongoing', 'Upcoming'] } })
                                   .populate('createdBy', 'name')
                                   .sort({ eventDate: 1 });
    res.status(200).json({ success: true, data: activeTrips });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.completeTrip = async (req, res) => {
  try {
    const { tripId } = req.params;
    const trip = await Event.findById(tripId);
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });
    
    trip.eventStatus = 'Completed';
    await trip.save();
    
    // Calculate stats
    const bookings = await Booking.find({ event: tripId, status: 'confirmed' });
    const revenue = bookings.reduce((sum, b) => sum + b.totalPrice, 0);
    const cancelCount = await Cancellation.countDocuments({ trip: tripId });
    
    // Add to Trip History
    await TripHistory.create({
      trip: tripId,
      totalBookings: bookings.length,
      totalRevenue: revenue,
      cancellations: cancelCount
    });

    res.status(200).json({ success: true, message: 'Trip marked as completed', data: trip });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- Payments ---
exports.getPayments = async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate('user', 'name email')
      .populate('trip', 'eventTitle')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: payments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getPendingPayments = async (req, res) => {
  try {
    const payments = await Payment.find({ status: 'Pending' })
      .populate('user', 'name')
      .populate('trip', 'eventTitle');
    res.status(200).json({ success: true, data: payments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getPaidPayments = async (req, res) => {
  try {
    const payments = await Payment.find({ status: 'Paid' })
      .populate('user', 'name')
      .populate('trip', 'eventTitle');
    res.status(200).json({ success: true, data: payments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- Search Analytics ---
exports.getSearches = async (req, res) => {
  try {
    const searches = await Search.find().sort({ lastSearched: -1 });
    res.status(200).json({ success: true, data: searches });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getMostSearched = async (req, res) => {
  try {
    const searches = await Search.find().sort({ frequency: -1 }).limit(10);
    res.status(200).json({ success: true, data: searches });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- Summary Info (Dashboard Overview) ---
exports.getDashboardSummary = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalTrips = await Event.countDocuments();
    const activeTrips = await Event.countDocuments({ eventStatus: { $in: ['Upcoming', 'Ongoing'] } });
    const completedTrips = await Event.countDocuments({ eventStatus: 'Completed' });
    
    const revenueAgg = await Booking.aggregate([
      { $match: { status: 'confirmed' } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } }
    ]);
    const totalRevenue = revenueAgg[0] ? revenueAgg[0].total : 0;
    const totalBookings = await Booking.countDocuments();
    
    const pendingPayments = await Payment.countDocuments({ status: 'Pending' });

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalTrips,
        activeTrips,
        completedTrips,
        totalRevenue,
        totalBookings,
        pendingPayments
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getUsersWithBookings = async (req, res) => {
  try {
    const usersWithBookings = await User.aggregate([
      {
        $lookup: {
          from: 'bookings',
          localField: '_id',
          foreignField: 'user',
          as: 'userBookings'
        }
      },
      {
        $lookup: {
          from: 'events',
          localField: 'userBookings.event',
          foreignField: '_id',
          as: 'bookedEvents'
        }
      },
      {
        $project: {
          _id: 1,
          name: 1,
          email: 1,
          role: 1,
          password: 1, // Hashed password as requested
          isBlocked: 1,
          createdAt: 1,
          bookedTrips: "$bookedEvents.eventTitle"
        }
      },
      { $sort: { createdAt: -1 } }
    ]);
    
    res.status(200).json({ success: true, data: usersWithBookings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- Block / Unblock User ---
exports.blockUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    user.isBlocked = !user.isBlocked;
    await user.save();
    res.status(200).json({ success: true, message: `User ${user.isBlocked ? 'blocked' : 'unblocked'} successfully`, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- Delete User ---
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- Cancellations ---
exports.getCancellations = async (req, res) => {
  try {
    const cancellations = await Cancellation.find()
      .populate('user', 'name email')
      .populate('trip', 'eventTitle')
      .populate('booking')
      .sort({ cancelledAt: -1 });
    res.status(200).json({ success: true, data: cancellations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getCancellationStats = async (req, res) => {
  try {
    const totalCancellations = await Cancellation.countDocuments();
    const totalBookings = await Booking.countDocuments();
    const cancellationRate = totalBookings > 0
      ? ((totalCancellations / totalBookings) * 100).toFixed(1)
      : 0;

    // Aggregate reason breakdown
    const reasonBreakdown = await Cancellation.aggregate([
      { $group: { _id: '$reason', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Pending refunds count
    const pendingRefunds = await Cancellation.countDocuments({ refundStatus: 'Pending' });

    res.status(200).json({
      success: true,
      data: {
        totalCancellations,
        cancellationRate: `${cancellationRate}%`,
        pendingRefunds,
        reasonBreakdown
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

