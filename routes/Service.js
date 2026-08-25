 // server/routes/serviceRoutes.js
import express from 'express';
import Service from '../models/Service.js';

const router = express.Router();

// POST - Create new service enquiry
router.post('/', async (req, res) => {
  try {
    const { businessName, natureOfBusiness, businessAddress, name, phone, email, subject, message } = req.body;

    // Validate required fields
    if (!businessName || !natureOfBusiness || !name || !phone || !email || !subject || !message) {
      return res.status(400).json({ 
        success: false, 
        message: 'All required fields must be filled' 
      });
    }

    const service = new Service({
      businessName,
      natureOfBusiness,
      businessAddress: businessAddress || '',
      name,
      phone,
      email,
      subject,
      message,
      status: 'unread',
      source: 'Services Page'
    });

    await service.save();
    
    res.status(201).json({
      success: true,
      message: 'Consultation request submitted successfully',
      data: service
    });
  } catch (error) {
    console.error('Error creating service enquiry:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// GET - Get all service enquiries with filters
router.get('/', async (req, res) => {
  try {
    const { status, phone, email, search } = req.query;
    let filter = {};

    // Filter by status (read/unread)
    if (status && ['read', 'unread'].includes(status)) {
      filter.status = status;
    }

    // Filter by phone
    if (phone) {
      filter.phone = { $regex: phone, $options: 'i' };
    }

    // Filter by email
    if (email) {
      filter.email = { $regex: email, $options: 'i' };
    }

    // Search across multiple fields
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { businessName: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } }
      ];
    }

    const enquiries = await Service.find(filter).sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: enquiries.length,
      data: enquiries
    });
  } catch (error) {
    console.error('Error fetching service enquiries:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// GET - Get single enquiry by ID
router.get('/:id', async (req, res) => {
  try {
    const enquiry = await Service.findById(req.params.id);
    
    if (!enquiry) {
      return res.status(404).json({
        success: false,
        message: 'Enquiry not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: enquiry
    });
  } catch (error) {
    console.error('Error fetching enquiry:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// PUT - Update enquiry status (read/unread)
router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['read', 'unread'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be "read" or "unread"'
      });
    }

    const enquiry = await Service.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );
    
    if (!enquiry) {
      return res.status(404).json({
        success: false,
        message: 'Enquiry not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: `Enquiry marked as ${status}`,
      data: enquiry
    });
  } catch (error) {
    console.error('Error updating enquiry:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// DELETE - Delete enquiry
router.delete('/:id', async (req, res) => {
  try {
    const enquiry = await Service.findByIdAndDelete(req.params.id);
    
    if (!enquiry) {
      return res.status(404).json({
        success: false,
        message: 'Enquiry not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Enquiry deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting enquiry:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

export default router;