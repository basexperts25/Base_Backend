// server/routes/Status.js - FIXED FOR YEARLY
import express from 'express';
import Status from '../models/Status.js';
import Client from '../models/Client.js';

const router = express.Router();

// GET - Get all statuses for a client
router.get('/client/:clientId', async (req, res) => {
  try {
    const { clientId } = req.params;
    const statuses = await Status.find({ clientId });
    res.status(200).json({ success: true, data: statuses });
  } catch (error) {
    console.error('Error fetching statuses:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// GET - Get status for a specific period
router.get('/client/:clientId/period/:period', async (req, res) => {
  try {
    const { clientId, period } = req.params;
    const status = await Status.findOne({ clientId, period });
    res.status(200).json({ success: true, data: status });
  } catch (error) {
    console.error('Error fetching period status:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// POST - Create or update status for a cell
router.post('/update', async (req, res) => {
  try {
    const {
      clientId,
      serviceName,
      rowIndex,
      period,
      columnName,
      color,
      fileUploaded,
      fileUrl,
      filePublicId,
      fileResourceType
    } = req.body;

    console.log('📊 Status update request:', {
      clientId,
      serviceName,
      rowIndex,
      period,
      columnName,
      color
    });

    // Validate required fields
    if (!clientId || !serviceName || rowIndex === undefined || !period || !columnName) {
      console.log('❌ Missing fields:', {
        clientId,
        serviceName,
        rowIndex,
        period,
        columnName
      });

      return res.status(400).json({
        success: false,
        message: 'Missing required fields: clientId, serviceName, rowIndex, period, columnName'
      });
    }

    // Check client exists
    const client = await Client.findById(clientId);
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }

    // Find or create the period document
    let status = await Status.findOne({ clientId, period });

    if (!status) {
      console.log(`✅ Creating new status document for period: ${period}`);
      status = new Status({
        clientId,
        period,
        services: new Map()
      });
    }

    // Ensure service exists
    if (!status.services.has(serviceName)) {
      console.log(`✅ Creating new service: ${serviceName} in period: ${period}`);
      status.services.set(serviceName, {
        rows: new Map()
      });
    }

    const serviceData = status.services.get(serviceName);
    
    // Ensure row exists
    const rowKey = String(rowIndex);
    if (!serviceData.rows.has(rowKey)) {
      console.log(`✅ Creating new row: ${rowKey} for service: ${serviceName}`);
      serviceData.rows.set(rowKey, {
        columns: new Map()
      });
    }

    const rowData = serviceData.rows.get(rowKey);
    
    // Update the specific column
    const columnData = rowData.columns.get(columnName) || {};
    if (color !== undefined) columnData.color = color;
    if (fileUploaded !== undefined) columnData.fileUploaded = fileUploaded;
    if (fileUrl !== undefined) columnData.fileUrl = fileUrl;
    if (filePublicId !== undefined) columnData.filePublicId = filePublicId;
    if (fileResourceType !== undefined) columnData.fileResourceType = fileResourceType;
    
    console.log(`✅ Updating column: ${columnName} with color: ${color}`);
    rowData.columns.set(columnName, columnData);
    serviceData.rows.set(rowKey, rowData);
    status.services.set(serviceName, serviceData);
    
    await status.save();
    console.log(`✅ Status saved successfully for period: ${period}`);

    // Update client.serviceRows color
    try {
      const updatePath = `serviceRows.${serviceName}.${parseInt(rowIndex)}.data.${columnName}`;
      await Client.findByIdAndUpdate(
        clientId,
        { $set: { [updatePath]: color || 'white' } }
      );
      console.log(`✅ Client.serviceRows updated: ${updatePath} = ${color}`);
    } catch (updateError) {
      console.error('❌ Error updating client.serviceRows:', updateError);
    }

    res.status(200).json({
      success: true,
      message: 'Status updated successfully',
      data: status
    });

  } catch (error) {
    console.error('❌ Error updating status:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// DELETE - Remove a specific file
router.delete('/file/:clientId/:period/:serviceName/:rowIndex/:columnName', async (req, res) => {
  try {
    const { clientId, period, serviceName, rowIndex, columnName } = req.params;

    const status = await Status.findOne({ clientId, period });
    if (!status) {
      return res.status(404).json({ success: false, message: 'Status not found' });
    }

    // Reset the column
    if (status.services.has(serviceName)) {
      const serviceData = status.services.get(serviceName);
      const rowKey = String(rowIndex);
      if (serviceData.rows.has(rowKey)) {
        const rowData = serviceData.rows.get(rowKey);
        rowData.columns.set(columnName, {
          color: 'white',
          fileUploaded: false,
          fileUrl: '',
          filePublicId: '',
          fileResourceType: ''
        });
        serviceData.rows.set(rowKey, rowData);
        status.services.set(serviceName, serviceData);
        await status.save();
      }
    }

    // Update client.serviceRows
    try {
      const updatePath = `serviceRows.${serviceName}.${parseInt(rowIndex)}.data.${columnName}`;
      await Client.findByIdAndUpdate(
        clientId,
        { $set: { [updatePath]: 'white' } }
      );
    } catch (updateError) {
      console.error('Error updating client.serviceRows:', updateError);
    }

    res.status(200).json({
      success: true,
      message: 'File removed successfully',
      data: status
    });

  } catch (error) {
    console.error('Error removing file:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// DELETE - Remove an entire period
router.delete('/period/:clientId/:period', async (req, res) => {
  try {
    const { clientId, period } = req.params;
    await Status.deleteOne({ clientId, period });
    res.status(200).json({
      success: true,
      message: 'Period deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting period:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

export default router;