const Booking = require('../models/Booking');
const Event = require('../models/Event');
const Payment = require('../models/Payment');
const Cancellation = require('../models/Cancellation');

// Lazy-load io to avoid circular dependency issues
const getIO = () => {
  try { return require('../index').io; } catch { return null; }
};


exports.bookEvent = async (req, res) => {
  try {
    const { eventId, tickets, donationAmount } = req.body;
    
    if (!eventId || !tickets) {
      return res.status(400).json({ success: false, message: 'Missing event ID or ticket count' });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Expedition not found' });
    }

    // Calculate final price. Priority: 1. Body amount, 2. Event suggested, 3. Event budget, 4. Zero
    const pricePerTicket = donationAmount !== undefined ? donationAmount : (event.suggestedDonation || 0);
    const totalPrice = pricePerTicket * tickets;

    const booking = await Booking.create({ 
      event: eventId, 
      user: req.user._id, 
      tickets, 
      totalPrice 
    });

    // Auto-create a Payment record so admin Payment Management has real data
    await Payment.create({
      user: req.user._id,
      trip: eventId,
      amount: totalPrice,
      status: 'Pending',
      paymentMethod: 'Cash on Arrival',
      currency: 'INR'
    });

    // Emit real-time notification to admin dashboard
    const io = getIO();
    if (io) {
      io.emit('new-booking', { tripName: event.eventTitle, userId: req.user._id });
    }

    res.status(201).json({ 
      success: true, 
      message: 'Expedition booked successfully', 
      booking 
    });
  } catch (err) {
    console.error('Booking Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getUserBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id }).populate('event');
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    booking.status = 'cancelled';
    const event = await Event.findById(booking.event);
    if (event) {
      event.availableSeats += booking.tickets;
      await event.save();
    }
    await booking.save();

    // Auto-create a Cancellation record for admin analytics
    await Cancellation.create({
      booking: booking._id,
      user: booking.user,
      trip: booking.event,
      reason: 'Cancelled by user',
      refundStatus: 'Pending'
    });

    res.json(booking);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
