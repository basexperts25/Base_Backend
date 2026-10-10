// server/models/ClientHandlers.js
import mongoose from 'mongoose';

const clientHandlerSchema = new mongoose.Schema({
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
  username: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    default: null
  },
  clientSupportNumber: {
    type: String,
    trim: true,
    default: ''
  },
  password: {
    type: String,
    default: null
  },
  isDefaultPassword: {
    type: Boolean,
    default: true
  },
  role: {
    type: String,
    enum: ['superadmin', 'admin', 'clienthandler'],
    default: 'clienthandler'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

export default mongoose.model('ClientHandler', clientHandlerSchema);