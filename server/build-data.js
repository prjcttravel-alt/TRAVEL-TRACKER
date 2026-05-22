const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const Event = require('./models/Event');
const Category = require('./models/Category');

const uri = 'mongodb+srv://prjcttravel_db_user:Pokemon47@cluster0.zrrkpq9.mongodb.net/?appName=Cluster0';

async function buildData() {
  try {
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');
    
    const events = await Event.find().populate('category').lean();
    const categories = await Category.find().lean();
    
    const apiDir = path.join(__dirname, '..', 'client', 'public', 'api');
    fs.mkdirSync(apiDir, { recursive: true });
    
    fs.writeFileSync(path.join(apiDir, 'events.json'), JSON.stringify({ data: events }));
    fs.writeFileSync(path.join(apiDir, 'categories.json'), JSON.stringify({ data: categories }));
    
    console.log(`Generated ${events.length} events and ${categories.length} categories.`);
    process.exit(0);
  } catch (err) {
    console.error('Error generating static data:', err);
    process.exit(1);
  }
}

buildData();
