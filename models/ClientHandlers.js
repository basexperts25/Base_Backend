// server/models/CareTaker.js
import mongoose from 'mongoose';

const clienthandlerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  // email: {
  //   type: String,
  //   required: [true, 'Email is required'],
  //   trim: true,
  //   lowercase: true
  // },
  phone: {
    type: String,
    required: [true, 'Phone is required'],
    trim: true
  },
  designation: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('ClientHandler', clienthandlerSchema);