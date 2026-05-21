require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const seedDatabase = require('./utils/seed');

const app = express();
const server = http.createServer(app);

// Socket.io — used for real-time admin notifications
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

io.on('connection', (socket) => {
  console.log('🔌 Admin socket connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('🔌 Admin socket disconnected:', socket.id);
  });
});

// Export io so controllers can emit events (e.g., new-booking)
module.exports.io = io;

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5001',
  process.env.CLIENT_URL,
  process.env.RENDER_EXTERNAL_URL,       // Render auto-injects this
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, same-origin)
    if (!origin) return callback(null, true);
    // In production allow the same-origin requests (frontend served by Express)
    if (process.env.NODE_ENV === 'production') return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));
app.use(express.json());

// Request logger for debugging
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
  next();
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/events', require('./routes/event.routes'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/users', require('./routes/user.routes'));
app.use('/api/posts', require('./routes/post.routes'));
app.use('/api/admin', require('./routes/admin.routes'));
app.use('/api/activities', require('./routes/activity.routes'));
app.use('/api/community', require('./routes/community.routes'));
app.use('/api/messages', require('./routes/message.routes'));
app.use('/api/recommendations', require('./routes/recommendation.routes'));
app.use('/api/reports', require('./routes/report.routes'));
app.use('/api/travel', require('./routes/travel.routes'));
app.use('/api/search', require('./routes/search.routes'));

const path = require('path');
const ROOT_DIR = path.resolve(__dirname, '..');

// Serve Admin Dashboard Static Files
app.use('/admin-dashboard', express.static(path.join(ROOT_DIR, 'admin-dashboard', 'dist')));

// Handle Admin Dashboard SPA Routing (must be before the catch-all)
app.get('/admin-dashboard/*', (req, res) => {
  const indexFile = path.join(ROOT_DIR, 'admin-dashboard', 'dist', 'index.html');
  res.sendFile(indexFile, (err) => {
    if (err) res.status(404).send('Admin dashboard not built. Run: npm run build:admin');
  });
});

// Serve User Client (catch-all — must be last)
app.use(express.static(path.join(ROOT_DIR, 'client', 'dist')));
app.get('*', (req, res) => {
  const indexFile = path.join(ROOT_DIR, 'client', 'dist', 'index.html');
  res.sendFile(indexFile, (err) => {
    if (err) res.status(404).send('Client not built. Run: npm run build:client');
  });
});

const startServer = async () => {
  const PORT = process.env.PORT || 5001;

  // Attach a server-level error handler BEFORE listen so EADDRINUSE
  // never becomes an unhandled exception that crashes the process.
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`\n❌ Port ${PORT} is already in use.`);
      console.error(`   Stop the other process, or run:  node dev.js  from the project root`);
      console.error(`   (dev.js clears ports automatically before starting)\n`);
    } else {
      console.error('Server error:', err.message);
    }
    process.exit(1);
  });

  try {
    await connectDB();

    // Only seed in development — never wipe production data on every deploy
    if (process.env.NODE_ENV !== 'production') {
      const mongoose = require('mongoose');
      if (mongoose.connection.readyState === 1) {
        try {
          await seedDatabase();
        } catch (seedErr) {
          console.error('⚠️ Database seeding failed:', seedErr.message);
        }
      } else {
        console.warn('⚠️ Database seeding skipped because mongoose is not connected.');
      }
    } else {
      console.log('🚀 Production mode: skipping auto-seed to preserve data.');
    }
  } catch (error) {
    console.error('⚠️ Failed to configure database:', error.message);
  }
};

startServer();
