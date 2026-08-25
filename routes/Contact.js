// server/routes/contactRoutes.js
import express from 'express';
import Contact from '../models/Contact.js';

const router = express.Router();

// POST - Create new contact enquiry
router.post('/', async (req, res) => {
  try {
    const { businessName, natureOfBusiness, businessAddress, name, phone, email, subject, message } = req.body;

    // Validate required fields - ALL MANDATORY
    if (!businessName || !natureOfBusiness || !businessAddress || !name || !phone || !email || !subject || !message) {
      return res.status(400).json({ 
        success: false, 
        message: 'All fields are required' 
      });
    }

    const contact = new Contact({
      businessName,
      natureOfBusiness,
      businessAddress,
      name,
      phone,
      email,
      subject,
      message,
      status: 'unread',
      source: 'Contact Page'
    });

    await contact.save();
    
    res.status(201).json({
      success: true,
      message: 'Enquiry submitted successfully',
      data: contact
    });
  } catch (error) {
    console.error('Error creating contact:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// GET - Get all contacts with filters
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
        { businessName: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
        { natureOfBusiness: { $regex: search, $options: 'i' } }
      ];
    }

    const contacts = await Contact.find(filter).sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: contacts.length,
      data: contacts
    });
  } catch (error) {
    console.error('Error fetching contacts:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// GET - Get single contact by ID
router.get('/:id', async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);
    
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: contact
    });
  } catch (error) {
    console.error('Error fetching contact:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// PUT - Update contact status (read/unread)
router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['read', 'unread'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be "read" or "unread"'
      });
    }

    const contact = await Contact.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );
    
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: `Contact marked as ${status}`,
      data: contact
    });
  } catch (error) {
    console.error('Error updating contact:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// DELETE - Delete contact
router.delete('/:id', async (req, res) => {
  try {
    const contact = await Contact.findByIdAndDelete(req.params.id);
    
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Contact deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting contact:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

export default router;