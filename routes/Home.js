// server/routes/homeRoutes.js
import express from 'express';
import Home from '../models/Home.js';

const router = express.Router();

// POST - Create new home enquiry
router.post('/', async (req, res) => {
  try {
    const { name, phone, email, subject, message } = req.body;

    // Validate required fields
    if (!name || !phone || !email || !subject || !message) {
      return res.status(400).json({ 
        success: false, 
        message: 'All fields are required' 
      });
    }

    const home = new Home({
      name,
      phone,
      email,
      subject,
      message,
      status: 'unread',
      source: 'Home Page'
    });

    await home.save();
    
    res.status(201).json({
      success: true,
      message: 'Enquiry submitted successfully',
      data: home
    });
  } catch (error) {
    console.error('Error creating home enquiry:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// GET - Get all home enquiries with filters
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
        { subject: { $regex: search, $options: 'i' } }
      ];
    }

    const enquiries = await Home.find(filter).sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: enquiries.length,
      data: enquiries
    });
  } catch (error) {
    console.error('Error fetching home enquiries:', error);
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
    const enquiry = await Home.findById(req.params.id);
    
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

    const enquiry = await Home.findByIdAndUpdate(
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
    const enquiry = await Home.findByIdAndDelete(req.params.id);
    
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