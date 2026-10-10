// server/models/Status.js
import mongoose from 'mongoose';

const columnSchema = new mongoose.Schema({
  color: {
    type: String,
    enum: ['white', 'yellow', 'red', 'green'],
    default: 'white'
  },
  fileUploaded: { type: Boolean, default: false },
  fileUrl: { type: String, default: '' },
  filePublicId: { type: String, default: '' },
  fileResourceType: { type: String, default: '' }
}, { _id: false, minimize: false });

const rowSchema = new mongoose.Schema({
  columns: {
    type: Map,
    of: columnSchema,
    default: {}
  }
}, { _id: false, minimize: false });

const serviceSchema = new mongoose.Schema({
  rows: {
    type: Map,
    of: rowSchema,
    default: {}
  }
}, { _id: false, minimize: false });

const statusSchema = new mongoose.Schema({
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  period: {
    type: String,
    required: true
  },
  services: {
    type: Map,
    of: serviceSchema,
    default: {}
  }
}, {
  timestamps: true,
  minimize: false
});

statusSchema.index({ clientId: 1, period: 1 }, { unique: true });

export default mongoose.model('Status', statusSchema);