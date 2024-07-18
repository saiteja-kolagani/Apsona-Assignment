const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoURI = 'mongodb+srv://saitejakolagani:MongoDB%3C%2F%3E1919%40205101@cluster0.kvjxfms.mongodb.net/notes-app?retryWrites=true&w=majority&appName=Cluster0' || 'mongodb://localhost:27017/notes-app';
    await mongoose.connect(mongoURI);
    console.log('MongoDB connected...');
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
