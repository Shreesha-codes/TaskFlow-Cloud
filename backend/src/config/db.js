const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async (mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/taskboard') => {
  if (isConnected) {
    return;
  }

  try {
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = true;
    console.log(`[MongoDB] Connected: ${conn.connection.host}/${conn.connection.name}`);
  } catch (error) {
    isConnected = false;
    console.error(`[MongoDB] Connection error: ${error.message}`);
    // In production/k8s we let readiness probes catch this instead of immediately crashing
  }
};

const checkDBStatus = () => {
  return mongoose.connection.readyState === 1;
};

module.exports = { connectDB, checkDBStatus };
