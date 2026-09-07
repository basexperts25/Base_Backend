// server/models/Status.js - ULTIMATE OPTIMIZED VERSION (1 doc per month)
import mongoose from 'mongoose';

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
  // All services in one document
  services: {
    type: Map,
    of: {
      // Each service has rows
      rows: {
        type: Map,
        of: {
          // Each row has columns
          columns: {
            type: Map,
            of: {
              color: {
                type: String,
                enum: ['white', 'yellow', 'red', 'green'],
                default: 'white'
              },
              fileUploaded: {
                type: Boolean,
                default: false
              },
              fileUrl: {
                type: String,
                default: ''
              },
              filePublicId: {
                type: String,
                default: ''
              },
              fileResourceType: {
                type: String,
                default: ''
              }
            },
            default: {}
          }
        },
        default: {}
      }
    },
    default: {}
  }
}, {
  timestamps: true
});

// Compound unique index to ensure one document per client per period
statusSchema.index(
  { clientId: 1, period: 1 },
  { unique: true }
);

export default mongoose.model('Status', statusSchema);