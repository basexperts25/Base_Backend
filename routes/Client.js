// server/routes/clientRoutes.js
import express from 'express';
import Client from '../models/Client.js';
import CareTaker from '../models/ClientHandlers.js';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Configure Cloudinary using environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

console.log('Cloudinary configured with:', {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY ? '✅ Set' : '❌ Missing',
  api_secret: process.env.CLOUDINARY_API_SECRET ? '✅ Set' : '❌ Missing'
});

const router = express.Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, JPG, GIF, and PDF are allowed.'));
    }
  }
});

// ===== CARE TAKER ROUTES =====

// GET all caretakers
router.get('/caretakers', async (req, res) => {
  try {
    const caretakers = await CareTaker.find({ isActive: true });
    res.status(200).json({ success: true, data: caretakers });
  } catch (error) {
    console.error('Error fetching caretakers:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// POST - Create new caretaker
router.post('/caretakers', async (req, res) => {
  try {
    const { name, phone, designation } = req.body;

    // Only name and phone are required (email removed)
    if (!name || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Name and phone are required'
      });
    }

    // Check if phone already exists
    const existingHandler = await CareTaker.findOne({ phone });
    if (existingHandler) {
      return res.status(400).json({
        success: false,
        message: 'Phone number already registered'
      });
    }

    const careTaker = new CareTaker({
      name,
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

// PUT - Update caretaker
router.put('/caretakers/:id', async (req, res) => {
  try {
    const { name, phone, designation } = req.body;

    const careTaker = await CareTaker.findByIdAndUpdate(
      req.params.id,
      { name, phone, designation },
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

// DELETE - Delete caretaker
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

router.post('/register', async (req, res) => {
  try {
    const { concernName, businessName, panNo, aadharNo, gstNo } = req.body;
    if (!concernName || !businessName || !panNo || !aadharNo) {
      return res.status(400).json({ success: false, message: 'All required fields must be filled' });
    }
    const existingClient = await Client.findOne({ $or: [{ panNo: panNo.toUpperCase() }, { businessName }] });
    if (existingClient) {
      return res.status(400).json({ success: false, message: 'Client with this PAN or Business Name already exists' });
    }

    // Remove spaces from PAN and Aadhaar
    const cleanPan = panNo.replace(/\s/g, '').toUpperCase();
    const cleanAadhaar = aadharNo.replace(/\s/g, '');

    const client = new Client({
      concernName,
      businessName,
      panNo: cleanPan,
      aadharNo: cleanAadhaar,
      gstNo: gstNo ? gstNo.toUpperCase() : '',
      authorisedPerson: {
        aadhaarNo: cleanAadhaar,
        name: concernName
      },
      username: null,
      password: null,
      status: 'pending'
    });
    await client.save();
    res.status(201).json({
      success: true,
      message: 'Client registered successfully',
      data: client
    });
  } catch (error) {
    console.error('Error registering client:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

router.get('/pending', async (req, res) => {
  try {
    const clients = await Client.find({ status: 'pending' })
      .populate('careTaker', 'name email phone designation')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: clients.length, data: clients });
  } catch (error) {
    console.error('Error fetching pending clients:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

router.get('/registered', async (req, res) => {
  try {
    const clients = await Client.find({ status: { $in: ['registered', 'active'] } })
      .populate('careTaker', 'name email phone designation')
      .sort({ registeredAt: -1 });
    res.status(200).json({ success: true, count: clients.length, data: clients });
  } catch (error) {
    console.error('Error fetching registered clients:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// ===== UPDATE CLIENT ROUTE =====
router.put('/:id', async (req, res) => {
  try {
    const updates = req.body;

    // Remove fields that shouldn't be updated or are causing validation issues
    // Don't allow updating these fields through this route
    delete updates._id;
    delete updates.createdAt;
    delete updates.updatedAt;
    delete updates.status; // Status should only be updated via /approve route

    // If panNo is being sent as empty string, remove it from updates
    // to avoid validation error (since it's required in schema)
    if (updates.panNo === '' || updates.panNo === null || updates.panNo === undefined) {
      delete updates.panNo;
    }

    // Similarly handle other required fields that might be empty
    if (updates.concernName === '' || updates.concernName === null) {
      delete updates.concernName;
    }
    if (updates.businessName === '' || updates.businessName === null) {
      delete updates.businessName;
    }

    const client = await Client.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      {
        new: true,
        runValidators: false, // Disable validators to allow partial updates
        context: 'query'
      }
    ).populate('careTaker', 'name email phone designation');

    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }

    res.status(200).json({ success: true, message: 'Client updated successfully', data: client });
  } catch (error) {
    console.error('Error updating client:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// ===== UPDATE STATUTORY REGISTRATION =====
router.put('/:id/statutory', async (req, res) => {
  try {
    const { concernType, panNo, msmeNo, gstNo, tanNo, authorisedPerson, isGstApplicable, isTanApplicable } = req.body;

    const updateData = {};

    // Only add fields that are provided
    if (concernType !== undefined) updateData.concernType = concernType;
    if (panNo !== undefined && panNo !== '') updateData.panNo = panNo.toUpperCase();
    if (msmeNo !== undefined) updateData.msmeNo = msmeNo;
    if (gstNo !== undefined) updateData.gstNo = gstNo ? gstNo.toUpperCase() : '';
    if (tanNo !== undefined) updateData.tanNo = tanNo ? tanNo.toUpperCase() : '';
    if (isGstApplicable !== undefined) updateData.isGstApplicable = isGstApplicable;
    if (isTanApplicable !== undefined) updateData.isTanApplicable = isTanApplicable;
    if (authorisedPerson !== undefined) {
      updateData.authorisedPerson = {
        ...(client.authorisedPerson || {}),
        ...authorisedPerson
      };
    }

    const client = await Client.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      {
        new: true,
        runValidators: false // Disable validation for partial updates
      }
    ).populate('careTaker', 'name email phone designation');

    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }

    res.status(200).json({ success: true, message: 'Statutory details updated successfully', data: client });
  } catch (error) {
    console.error('Error updating statutory details:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const client = await Client.findById(req.params.id)
      .populate('careTaker', 'name email phone designation');
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }
    res.status(200).json({ success: true, data: client });
  } catch (error) {
    console.error('Error fetching client:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

router.put('/:id/approve', async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }

    const compliances = client.compliances && client.compliances.length > 0
      ? client.compliances
      : [];

    const totalFee = compliances.reduce(
      (sum, c) => sum + (c.isSelected ? (c.finalFee || c.agreeFee || 0) : 0),
      0
    );

    // ✅ Auto-create Version 1 when client is approved
    client.complianceHistory = [{
      version: 1,
      changedAt: new Date(),
      compliances: compliances,
      totalFee: totalFee,
      balanceFee: totalFee,       // initial balance = total fee
      setBy: 'System (Initial)'
    }];

    client.status = 'registered';
    client.activatedAt = new Date();

    await client.save();

    const populated = await Client.findById(client._id)
      .populate('careTaker', 'name email phone designation');

    res.status(200).json({
      success: true,
      message: 'Client approved successfully',
      data: populated
    });
  } catch (error) {
    console.error('Error approving client:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

router.put('/:id/password', async (req, res) => {
  try {
    const { password } = req.body;
    const client = await Client.findByIdAndUpdate(
      req.params.id,
      { password },
      { new: true, runValidators: true }
    );
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }
    res.status(200).json({ success: true, message: 'Password updated successfully', data: client });
  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const client = await Client.findByIdAndDelete(req.params.id);
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }
    res.status(200).json({ success: true, message: 'Client deleted successfully' });
  } catch (error) {
    console.error('Error deleting client:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password are required' });
    }
    const trimmedUsername = username.trim();
    const trimmedPassword = password.trim();
    const client = await Client.findOne({
      username: trimmedUsername,
      status: { $in: ['registered', 'active'] }
    }).populate('careTaker', 'name email phone designation');
    if (!client) {
      return res.status(401).json({ success: false, message: 'Invalid credentials or account not activated' });
    }
    if (trimmedPassword !== client.password) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    res.status(200).json({ success: true, message: 'Login successful', data: client });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

router.get('/portal/:clientId', async (req, res) => {
  try {
    const client = await Client.findById(req.params.clientId)
      .populate('careTaker', 'name email phone designation');
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }
    res.status(200).json({ success: true, data: client });
  } catch (error) {
    console.error('Error fetching client:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

router.put('/portal/:clientId/service/:serviceName/update', async (req, res) => {
  try {
    const { clientId, serviceName } = req.params;
    const { rowIndex, columnName, color } = req.body;
    const client = await Client.findById(clientId);
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }
    if (!client.serviceTables) {
      client.serviceTables = new Map();
    }
    if (!client.serviceTables.get(serviceName)) {
      client.serviceTables.set(serviceName, new Map());
    }
    const serviceTable = client.serviceTables.get(serviceName);
    const cellKey = `row${rowIndex}-${columnName}`;
    serviceTable.set(cellKey, color);
    await client.save();
    res.status(200).json({ success: true, message: 'Cell updated successfully', data: client });
  } catch (error) {
    console.error('Error updating cell:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

router.put('/portal/:clientId/service/:serviceName/add-row', async (req, res) => {
  try {
    const { clientId, serviceName } = req.params;
    const { month, year } = req.body;
    const client = await Client.findById(clientId);
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }
    if (!client.serviceRows) {
      client.serviceRows = new Map();
    }
    const rows = client.serviceRows.get(serviceName) || [];
    rows.push({ month, year, data: new Map() });
    client.serviceRows.set(serviceName, rows);
    await client.save();
    res.status(200).json({ success: true, message: 'Row added successfully', data: client });
  } catch (error) {
    console.error('Error adding row:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

router.get('/portal/:clientId/service/:serviceName', async (req, res) => {
  try {
    const { clientId, serviceName } = req.params;
    const client = await Client.findById(clientId);
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
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
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// ===== UPLOAD ROUTES =====

router.post('/upload/:clientId', upload.single('file'), async (req, res) => {
  try {
    const { clientId } = req.params;
    const { field } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    if (!field) {
      return res.status(400).json({
        success: false,
        message: 'Field is required'
      });
    }

    const client = await Client.findById(clientId);

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    const isPdf = file.mimetype === 'application/pdf';
    const resourceType = isPdf ? 'raw' : 'image';

    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `clients/${clientId}`,
          resource_type: resourceType,
          use_filename: true,
          unique_filename: true,
          access_mode: 'public'
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        }
      );

      uploadStream.end(file.buffer);
    });

    /*
      Convert:
      panUpload -> pan
      gstUpload -> gst
      msmeUpload -> msme
      tanUpload -> tan

      authorisedPerson.panUpload
      -> authorisedPerson.pan
    */

    const updateFields = {};

    if (field.includes('.')) {
      const [parent, child] = field.split('.');

      const baseField = child.replace(/Upload$/, '');

      updateFields[`${parent}.${child}`] = 'uploaded';
      updateFields[`${parent}.${baseField}Url`] = result.secure_url;
      updateFields[`${parent}.${baseField}PublicId`] = result.public_id;
      updateFields[`${parent}.${baseField}ResourceType`] = resourceType;

    } else {
      const baseField = field.replace(/Upload$/, '');

      updateFields[field] = 'uploaded';
      updateFields[`${baseField}Url`] = result.secure_url;
      updateFields[`${baseField}PublicId`] = result.public_id;
      updateFields[`${baseField}ResourceType`] = resourceType;
    }

    const updatedClient = await Client.findByIdAndUpdate(
      clientId,
      { $set: updateFields },
      { new: true, runValidators: false }
    );

    return res.status(200).json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        url: result.secure_url,
        publicId: result.public_id,
        resourceType,
        client: updatedClient
      }
    });

  } catch (error) {
    console.error('Upload error:', error);

    return res.status(500).json({
      success: false,
      message: 'File upload failed',
      error: error.message
    });
  }
});

// DELETE - Delete file from Cloudinary
router.delete('/delete-file/:publicId', async (req, res) => {
  try {
    const { publicId } = req.params;
    const { resourceType = 'image' } = req.query;

    if (!publicId) {
      return res.status(400).json({
        success: false,
        message: 'Public ID is required'
      });
    }

    const decodedPublicId = decodeURIComponent(publicId);

    console.log('Deleting Cloudinary file:', {
      publicId: decodedPublicId,
      resourceType
    });

    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.destroy(
        decodedPublicId,
        {
          resource_type: resourceType
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        }
      );
    });

    console.log('Cloudinary delete result:', result);

    if (result.result === 'ok') {
      return res.status(200).json({
        success: true,
        message: 'File deleted successfully from Cloudinary',
        result
      });
    }

    if (result.result === 'not found') {
      return res.status(200).json({
        success: true,
        message: 'File was already deleted from Cloudinary',
        result
      });
    }

    return res.status(400).json({
      success: false,
      message: 'Cloudinary could not delete the file',
      result
    });

  } catch (error) {
    console.error('Delete file error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to delete file',
      error: error.message
    });
  }
});

router.delete('/remove-file/:clientId', async (req, res) => {
  try {
    const { clientId } = req.params;
    const { field } = req.query;

    if (!field) {
      return res.status(400).json({
        success: false,
        message: 'Field is required'
      });
    }

    const client = await Client.findById(clientId);

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    let publicId;
    let resourceType;

    if (field.includes('.')) {
      const [parent, child] = field.split('.');

      const baseField = child.replace(/Upload$/, '');

      publicId = client[parent]?.[`${baseField}PublicId`];
      resourceType = client[parent]?.[`${baseField}ResourceType`] || 'image';

    } else {
      const baseField = field.replace(/Upload$/, '');

      publicId = client[`${baseField}PublicId`];
      resourceType = client[`${baseField}ResourceType`] || 'image';
    }

    // Delete from Cloudinary if publicId exists
    if (publicId) {
      console.log('Removing Cloudinary file:', {
        publicId,
        resourceType
      });

      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader.destroy(
          publicId,
          {
            resource_type: resourceType
          },
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result);
            }
          }
        );
      });

      console.log('Cloudinary remove result:', result);
    }

    // Clear MongoDB fields
    const updateFields = {};

    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      const baseField = child.replace(/Upload$/, '');

      updateFields[`${parent}.${child}`] = 'pending';
      updateFields[`${parent}.${baseField}Url`] = '';
      updateFields[`${parent}.${baseField}PublicId`] = '';
      updateFields[`${parent}.${baseField}ResourceType`] = '';

    } else {
      const baseField = field.replace(/Upload$/, '');

      updateFields[field] = 'pending';
      updateFields[`${baseField}Url`] = '';
      updateFields[`${baseField}PublicId`] = '';
      updateFields[`${baseField}ResourceType`] = '';
    }

    const updatedClient = await Client.findByIdAndUpdate(
      clientId,
      { $set: updateFields },
      {
        new: true,
        runValidators: false
      }
    );

    return res.status(200).json({
      success: true,
      message: 'File removed successfully',
      data: updatedClient
    });

  } catch (error) {
    console.error('Remove file error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to remove file',
      error: error.message
    });
  }
});

// ===== SET COMPLIANCE HISTORY (save current selection as new version) =====
router.post('/:id/compliance-set', async (req, res) => {
  try {
    const { compliances, balanceFee, setBy } = req.body;
    const client = await Client.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }

    const totalFee = (compliances || []).reduce(
      (sum, c) => sum + (c.isSelected ? (c.finalFee || c.agreeFee || 0) : 0),
      0
    );

    // Calculate next version number
    // If no history yet, seed Version 1 from current compliances
    if (!client.complianceHistory || client.complianceHistory.length === 0) {
      const initialCompliances = client.compliances || [];
      const initialTotal = initialCompliances.reduce(
        (sum, c) => sum + (c.isSelected ? (c.finalFee || c.agreeFee || 0) : 0),
        0
      );
      client.complianceHistory = [{
        version: 1,
        changedAt: client.registeredAt || client.createdAt || new Date(),
        compliances: initialCompliances,
        totalFee: initialTotal,
        balanceFee: client.balanceFee || initialTotal,
        setBy: 'System (Initial)'
      }];
    }

    const nextVersion = (client.complianceHistory?.length || 0) + 1;

const currentBalanceSnapshot = client.balanceFee || 0;

client.complianceHistory = client.complianceHistory || [];
client.complianceHistory.push({
  version: nextVersion,
  changedAt: new Date(),
  compliances: compliances || [],
  totalFee,
  balanceFee: currentBalanceSnapshot,   // snapshot for history only
  setBy: setBy || 'Admin'
});

// Update current compliances ONLY (balance untouched)
client.compliances = compliances || [];

    await client.save();

    res.status(200).json({
      success: true,
      message: 'Compliance set successfully',
      data: client
    });
  } catch (error) {
    console.error('Error setting compliance history:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// ===== UPDATE BALANCE FEE ONLY (independent from compliance) =====
router.put('/:id/balance', async (req, res) => {
  try {
    const { balanceFee } = req.body;
    const client = await Client.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }

    client.balanceFee = Number(balanceFee) || 0;

    // Also update the current (latest) history entry's balance so it reflects the change
    if (client.complianceHistory && client.complianceHistory.length > 0) {
      const latest = client.complianceHistory[client.complianceHistory.length - 1];
      latest.balanceFee = client.balanceFee;
    }

    await client.save();

    res.status(200).json({
      success: true,
      message: 'Balance updated successfully',
      data: client
    });
  } catch (error) {
    console.error('Error updating balance:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// ===== GET COMPLIANCE HISTORY =====
router.get('/:id/compliance-history', async (req, res) => {
  try {
    const client = await Client.findById(req.params.id).select('complianceHistory balanceFee compliances');
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }

    // Return most recent first
    const history = [...(client.complianceHistory || [])].reverse();

    res.status(200).json({
      success: true,
      data: {
        history,
        balanceFee: client.balanceFee || 0,
        currentCompliances: client.compliances || []
      }
    });
  } catch (error) {
    console.error('Error fetching compliance history:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

export default router;