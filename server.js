// server/server.js
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import contactRoutes from './routes/Contact.js';
import homeRoutes from './routes/Home.js'; 
import serviceRoutes from './routes/Service.js';
import clientRoutes from './routes/Client.js'; // Add this



dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/contacts', contactRoutes);
app.use('/home', homeRoutes);
app.use('/service', serviceRoutes);
app.use('/clients', clientRoutes); // Add this



// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/base_experts')
  .then(() => {
    console.log('✅ Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
  });