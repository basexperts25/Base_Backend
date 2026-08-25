// server/models/Service.js
import mongoose from 'mongoose';

const serviceSchema = new mongoose.Schema({
  businessName: {
    type: String,
    required: [true, 'Business name is required'],
    trim: true
  },
  natureOfBusiness: {
    type: String,
    required: [true, 'Nature of business is required'],
    trim: true
  },
  businessAddress: {
    type: String,
    trim: true,
    default: ''
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    trim: true
  },
  status: {
    type: String,
    enum: ['read', 'unread'],
    default: 'unread'
  },
  source: {
    type: String,
    default: 'Services Page'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Service', serviceSchema);