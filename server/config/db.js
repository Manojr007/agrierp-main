const mongoose = require('mongoose');

const connectDB = async () => {
  let uri = process.env.MONGO_URI;

  if (!uri || (!uri.startsWith('mongodb://') && !uri.startsWith('mongodb+srv://'))) {
    console.error('❌ MONGO_URI is missing or invalid. Set it to a valid MongoDB connection string.');
    console.error(`   Current value: "${uri || 'NOT SET'}"`);
    return;
  }

  // FORCE CORRECT CASING: MongoDB Atlas is case-sensitive. 
  // If the URI contains 'agrierp' (lowercase), replace it with 'Agrierp' (uppercase)
  if (uri.includes('.mongodb.net/agrierp')) {
    uri = uri.replace('.mongodb.net/agrierp', '.mongodb.net/Agrierp');
    console.log('🔄 Auto-corrected DB name casing to "Agrierp"');
  }

  try {
    const conn = await mongoose.connect(uri);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    // Don't call process.exit(1) — server keeps running, CORS still works
  }
};

module.exports = connectDB;
