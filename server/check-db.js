const mongoose = require('mongoose');
const Event = require('./models/Event');

async function run() {
  await mongoose.connect('mongodb+srv://prjcttravel_db_user:Pokemon47@cluster0.zrrkpq9.mongodb.net/?appName=Cluster0');
  const count = await Event.countDocuments();
  console.log('Total events in live DB:', count);
  process.exit(0);
}
run();
