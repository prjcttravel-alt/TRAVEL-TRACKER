const mongoose = require('mongoose');

mongoose.set('bufferTimeoutMS', 60000);

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) throw new Error('MONGO_URI is not defined');
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000,
      connectTimeoutMS: 3000,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ Standard MongoDB connection failed: ${error.message}`);
    console.log('🔄 Attempting to start an in-memory MongoDB server as fallback...');
    
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongoServer = await MongoMemoryServer.create();
      const memoryUri = mongoServer.getUri();
      
      const conn = await mongoose.connect(memoryUri);
      console.log(`✅ In-Memory MongoDB Connected: ${conn.connection.host}`);
      console.log('⚠️ NOTE: All data will be lost when the server restarts since it is using an in-memory database.');
    } catch (memError) {
      console.error(`❌ Failed to start in-memory MongoDB: ${memError.message}`);
      
      if (process.platform === 'win32') {
        console.log('\n========================================================================');
        console.log('💡 HINT: This error usually occurs because Microsoft Visual C++ Redistributable');
        console.log('   is not installed on this PC/laptop.');
        console.log('👉 Download and install it from the official Microsoft link:');
        console.log('   https://aka.ms/vs/17/release/vc_redist.x64.exe');
        console.log('   After installing it, restart your terminal and run the command again.');
        console.log('========================================================================\n');
      } else {
        console.log('\n========================================================================');
        console.log('💡 HINT: Please check that your system has MongoDB database dependencies installed');
        console.log('   or update MONGO_URI in your server/.env file to point to a working database.');
        console.log('========================================================================\n');
      }
      console.warn('\n⚠️ WARNING: Starting backend server WITHOUT database connection. Database operations will fail.\n');
    }
  }
};

module.exports = connectDB;
