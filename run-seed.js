const connectDB = require('./server/config/db');
const seedDatabase = require('./server/utils/seed');
const mongoose = require('mongoose');

async function run() {
  process.env.MONGO_URI = 'mongodb+srv://prjcttravel_db_user:Pokemon47@cluster0.zrrkpq9.mongodb.net/?appName=Cluster0';
  await connectDB();
  await seedDatabase();
  console.log('Seed completed successfully on production database!');
  process.exit(0);
}
run();
