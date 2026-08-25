// server/routes/clientRoutes.js
import express from 'express';
import Client from '../models/Client.js';
import CareTaker from '../models/ClientHandlers.js';

const router = express.Router();

// Helper: Generate username
const generateUsername = (businessName) => {
  const prefix = businessName.substring(0, 3).toUpperCase();
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}${randomNum}`;
};

// Helper: Generate password
const generatePassword = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
  let password = '';
  for (let i = 0; i < 10; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

// ===== CARE TAKER ROUTES =====
// GET - Get all care takers
router.get('/caretakers', async (req, res) => {
  try {
    const caretakers = await CareTaker.find({ isActive: true });
    res.status(200).json({
      success: true,
      data: caretakers
    });
  } catch (error) {
    console.error('Error fetching caretakers:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// POST - Create new care taker
router.post('/caretakers', async (req, res) => {
  try {
    const { name, email, phone, designation } = req.body;
    
    if (!name || !email || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Name, email and phone are required'
      });
    }
    
    const careTaker = new CareTaker({
      name,
      email,
      phone,
      designation: designation || '',
      isActive: true
    });
    
    await careTaker.save();
    
    res.status(201).json({
      success: true,
      message: 'Care taker added successfully',
      data: careTaker
    });
  } catch (error) {
    console.error('Error creating care taker:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// PUT - Update care taker
router.put('/caretakers/:id', async (req, res) => {
  try {
    const { name, email, phone, designation } = req.body;
    const careTaker = await CareTaker.findByIdAndUpdate(
      req.params.id,
      { name, email, phone, designation },
      { new: true, runValidators: true }
    );
    
    if (!careTaker) {
      return res.status(404).json({
        success: false,
        message: 'Care taker not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Care taker updated successfully',
      data: careTaker
    });
  } catch (error) {
    console.error('Error updating care taker:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// DELETE - Delete care taker
router.delete('/caretakers/:id', async (req, res) => {
  try {
    const careTaker = await CareTaker.findByIdAndDelete(req.params.id);
    
    if (!careTaker) {
      return res.status(404).json({
        success: false,
        message: 'Care taker not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Care taker deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting care taker:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// ===== CLIENT REGISTRATION ROUTES =====
// POST - Create new client registration
router.post('/register', async (req, res) => {
  try {
    const { concernName, businessName, panNo, aadharNo, gstNo } = req.body;

    if (!concernName || !businessName || !panNo || !aadharNo) {
      return res.status(400).json({
        success: false,
        message: 'All required fields must be filled'
      });
    }

    const existingClient = await Client.findOne({ 
      $or: [{ panNo: panNo.toUpperCase() }, { businessName }] 
    });
    if (existingClient) {
      return res.status(400).json({
        success: false,
        message: 'Client with this PAN or Business Name already exists'
      });
    }

    const username = generateUsername(businessName);
    const plainPassword = generatePassword();

    const client = new Client({
      concernName,
      businessName,
      panNo: panNo.toUpperCase(),
      aadharNo,
      gstNo: gstNo ? gstNo.toUpperCase() : '',
      username,
      password: plainPassword,
      status: 'pending'
    });

    await client.save();

    res.status(201).json({
      success: true,
      message: 'Client registered successfully',
      data: {
        ...client.toObject(),
        generatedPassword: plainPassword
      }
    });
  } catch (error) {
    console.error('Error registering client:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// GET - Get pending client requests
router.get('/pending', async (req, res) => {
  try {
    const clients = await Client.find({ status: 'pending' })
      .populate('careTaker', 'name email phone designation')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: clients.length,
      data: clients
    });
  } catch (error) {
    console.error('Error fetching pending clients:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// GET - Get registered clients
router.get('/registered', async (req, res) => {
  try {
    const clients = await Client.find({ status: { $in: ['registered', 'active'] } })
      .populate('careTaker', 'name email phone designation')
      .sort({ registeredAt: -1 });
    
    res.status(200).json({
      success: true,
      count: clients.length,
      data: clients
    });
  } catch (error) {
    console.error('Error fetching registered clients:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// PUT - Update client (ALL sections)
router.put('/:id', async (req, res) => {
  try {
    const updates = req.body;
    
    // Find and update the client
    const client = await Client.findByIdAndUpdate(
      req.params.id,
      updates,
      { 
        new: true, 
        runValidators: true 
      }
    ).populate('careTaker', 'name email phone designation');
    
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Client updated successfully',
      data: client
    });
  } catch (error) {
    console.error('Error updating client:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// GET - Get single client by ID
router.get('/:id', async (req, res) => {
  try {
    const client = await Client.findById(req.params.id)
      .populate('careTaker', 'name email phone designation');
    
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: client
    });
  } catch (error) {
    console.error('Error fetching client:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// PUT - Approve/Register client
router.put('/:id/approve', async (req, res) => {
  try {
    const client = await Client.findByIdAndUpdate(
      req.params.id,
      { 
        status: 'registered',
        activatedAt: new Date()
      },
      { new: true, runValidators: true }
    ).populate('careTaker', 'name email phone designation');
    
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Client approved successfully',
      data: client
    });
  } catch (error) {
    console.error('Error approving client:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// PUT - Regenerate password
router.put('/:id/password', async (req, res) => {
  try {
    const { password } = req.body;
    const client = await Client.findByIdAndUpdate(
      req.params.id,
      { password },
      { new: true, runValidators: true }
    );
    
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Password updated successfully',
      data: client
    });
  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// DELETE - Delete client
router.delete('/:id', async (req, res) => {
  try {
    const client = await Client.findByIdAndDelete(req.params.id);
    
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Client deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting client:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// POST - Client login (for frontend)
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required'
      });
    }
    
    // Trim username and password to remove any extra spaces
    const trimmedUsername = username.trim();
    const trimmedPassword = password.trim();
    
    console.log('Login attempt:', { username: trimmedUsername, password: trimmedPassword });
    
    const client = await Client.findOne({ 
      username: trimmedUsername,
      status: { $in: ['registered', 'active'] }
    }).populate('careTaker', 'name email phone designation');
    
    if (!client) {
      console.log('Client not found:', trimmedUsername);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials or account not activated'
      });
    }
    
    console.log('Stored password:', client.password);
    console.log('Input password:', trimmedPassword);
    
    // Direct password comparison (without bcrypt)
    if (trimmedPassword !== client.password) {
      console.log('Password mismatch');
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: client
    });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// GET - Get client by ID with all details (for client portal)
router.get('/portal/:clientId', async (req, res) => {
  try {
    const client = await Client.findById(req.params.clientId)
      .populate('careTaker', 'name email phone designation');
    
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: client
    });
  } catch (error) {
    console.error('Error fetching client:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// PUT - Update service table cell color
router.put('/portal/:clientId/service/:serviceName/update', async (req, res) => {
  try {
    const { clientId, serviceName } = req.params;
    const { rowIndex, columnName, color } = req.body;
    
    const client = await Client.findById(clientId);
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }
    
    // Initialize serviceTables if not exists
    if (!client.serviceTables) {
      client.serviceTables = new Map();
    }
    
    // Initialize service table if not exists
    if (!client.serviceTables.get(serviceName)) {
      client.serviceTables.set(serviceName, new Map());
    }
    
    const serviceTable = client.serviceTables.get(serviceName);
    const cellKey = `row${rowIndex}-${columnName}`;
    serviceTable.set(cellKey, color);
    
    await client.save();
    
    res.status(200).json({
      success: true,
      message: 'Cell updated successfully',
      data: client
    });
  } catch (error) {
    console.error('Error updating cell:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// PUT - Add row to service table
router.put('/portal/:clientId/service/:serviceName/add-row', async (req, res) => {
  try {
    const { clientId, serviceName } = req.params;
    const { month, year } = req.body;
    
    const client = await Client.findById(clientId);
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }
    
    // Initialize serviceRows if not exists
    if (!client.serviceRows) {
      client.serviceRows = new Map();
    }
    
    const rows = client.serviceRows.get(serviceName) || [];
    rows.push({
      month,
      year,
      data: new Map()
    });
    client.serviceRows.set(serviceName, rows);
    
    await client.save();
    
    res.status(200).json({
      success: true,
      message: 'Row added successfully',
      data: client
    });
  } catch (error) {
    console.error('Error adding row:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// GET - Get client's service table data
router.get('/portal/:clientId/service/:serviceName', async (req, res) => {
  try {
    const { clientId, serviceName } = req.params;
    
    const client = await Client.findById(clientId);
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }
    
    const serviceTables = client.serviceTables || new Map();
    const serviceRows = client.serviceRows || new Map();
    
    res.status(200).json({
      success: true,
      data: {
        tables: serviceTables.get(serviceName) || new Map(),
        rows: serviceRows.get(serviceName) || []
      }
    });
  } catch (error) {
    console.error('Error fetching service data:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

export default router;