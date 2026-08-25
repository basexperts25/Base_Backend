// server/models/Client.js
import mongoose from 'mongoose';

const clientSchema = new mongoose.Schema({
  // ===== BASIC DETAILS =====
  concernName: {
    type: String,
    required: [true, 'Concern name is required'],
    trim: true
  },
  businessName: {
    type: String,
    required: [true, 'Business name is required'],
    trim: true
  },
  address: {
    type: String,
    trim: true,
    default: ''
  },
  contactNo: {
    type: String,
    trim: true,
    default: ''
  },
  emailId: {
    type: String,
    trim: true,
    lowercase: true,
    default: ''
  },
  followUpContact: {
    type: String,
    trim: true,
    default: ''
  },
  followUpEmail: {
    type: String,
    trim: true,
    lowercase: true,
    default: ''
  },

  // ===== STATUTORY REGISTRATION =====
  concernType: {
    type: String,
    enum: ['Proprietor', 'Firm', 'Company', 'Trust', 'Others'],
    default: null
  },
  panNo: {
    type: String,
    required: [true, 'PAN number is required'],
    trim: true,
    uppercase: true
  },
  panUpload: {
    type: String,
    enum: ['pending', 'uploaded'],
    default: 'pending'
  },
  gstNo: {
    type: String,
    trim: true,
    uppercase: true,
    default: ''
  },
  gstUpload: {
    type: String,
    enum: ['pending', 'uploaded'],
    default: 'pending'
  },
  msmeNo: {
    type: String,
    trim: true,
    default: ''
  },
  msmeUpload: {
    type: String,
    enum: ['pending', 'uploaded'],
    default: 'pending'
  },
  tanNo: {
    type: String,
    trim: true,
    default: ''
  },
  tanUpload: {
    type: String,
    enum: ['pending', 'uploaded'],
    default: 'pending'
  },
  // Partners/Proprietors/Authorised Person
  authorisedPerson: {
    name: { type: String, default: '' },
    panNo: { type: String, default: '' },
    panUpload: { type: String, enum: ['pending', 'uploaded'], default: 'pending' },
    aadhaarNo: { type: String, default: '' },
    aadhaarUpload: { type: String, enum: ['pending', 'uploaded'], default: 'pending' }
  },

  // ===== BANKING DETAILS =====
  banks: [{
    bankName: { type: String, default: '' },
    accountType: { type: String, enum: ['CA', 'CC', 'OD', 'SB', 'Term Loan - Machinery', 'Term Loan - Assets', 'Term Loan - Vehicle', 'Term Loan - Business', 'Gold Loan', 'Others'], default: 'SB' },
    accountNo: { type: String, default: '' },
    renewalDate: { type: String, default: '' }
  }],

  // ===== STATUTORY APPLICABILITY =====
  compliances: [{
    complianceName: { type: String, default: '' },
    commitments: { type: String, default: '' },
    agreeFee: { type: Number, default: 0 },
    discountPercent: { type: Number, default: 0 },
    finalFee: { type: Number, default: 0 },
    isSelected: { type: Boolean, default: false }
  }],

  // ===== CREDENTIALS =====
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },

  // ===== CARE TAKER =====
  careTaker: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ClientHandler',
    default: null
  },

  // ===== STATUS =====
  status: {
    type: String,
    enum: ['pending', 'registered', 'active', 'inactive'],
    default: 'pending'
  },

  // ===== TIMESTAMPS =====
  registeredAt: {
    type: Date,
    default: Date.now
  },
  activatedAt: Date,

  createdAt: {
    type: Date,
    default: Date.now
  },

    // Service Tables Data
  serviceTables: {
    type: Map,
    of: {
      type: Map,
      of: {
        type: String,
        enum: ['white', 'yellow', 'red', 'green'],
        default: 'white'
      }
    },
    default: {}
  },
  
  // Service row data (months)
  serviceRows: {
    type: Map,
    of: [{
      month: String,
      year: String,
      data: {
        type: Map,
        of: String,
        default: {}
      }
    }],
    default: {}
  }
});



export default mongoose.model('Client', clientSchema);