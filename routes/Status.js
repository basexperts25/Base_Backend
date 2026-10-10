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
      clientId, serviceName, rowIndex, period, columnName,
      color, fileUploaded, fileUrl, filePublicId, fileResourceType
    } = req.body;

    if (!clientId || !serviceName || rowIndex === undefined || !period || !columnName) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    const client = await Client.findById(clientId);
    if (!client) return res.status(404).json({ success: false, message: 'Client not found' });

    let status = await Status.findOne({ clientId, period });
    if (!status) {
      status = new Status({ clientId, period, services: {} });
    }

    const rowKey = String(rowIndex);

    // Build the full nested path string
    const basePath = `services.${serviceName}.rows.${rowKey}.columns.${columnName}`;

    const setObj = {};
    if (color !== undefined)             setObj[`${basePath}.color`] = color;
    if (fileUploaded !== undefined)      setObj[`${basePath}.fileUploaded`] = fileUploaded;
    if (fileUrl !== undefined)           setObj[`${basePath}.fileUrl`] = fileUrl;
    if (filePublicId !== undefined)      setObj[`${basePath}.filePublicId`] = filePublicId;
    if (fileResourceType !== undefined)  setObj[`${basePath}.fileResourceType`] = fileResourceType;

    await Status.updateOne(
      { clientId, period },
      {
        $set: setObj,
        $setOnInsert: { clientId, period }
      },
      { upsert: true }
    );

    // Update client.serviceRows for quick access
    try {
      const updatePath = `serviceRows.${serviceName}.${parseInt(rowIndex)}.data.${columnName}`;
      await Client.findByIdAndUpdate(
        clientId,
        { $set: { [updatePath]: color || 'white' } }
      );
    } catch (updateError) {
      console.error('Error updating client.serviceRows:', updateError);
    }

    res.status(200).json({ success: true, message: 'Status updated successfully' });
  } catch (error) {
    console.error('❌ Error updating status:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// DELETE - Remove a specific file
router.delete('/file/:clientId/:period/:serviceName/:rowIndex/:columnName', async (req, res) => {
  try {
    const { clientId, period, serviceName, rowIndex, columnName } = req.params;

    const basePath = `services.${serviceName}.rows.${String(rowIndex)}.columns.${columnName}`;

    await Status.updateOne(
      { clientId, period },
      {
        $set: {
          [`${basePath}.color`]: 'white',
          [`${basePath}.fileUploaded`]: false,
          [`${basePath}.fileUrl`]: '',
          [`${basePath}.filePublicId`]: '',
          [`${basePath}.fileResourceType`]: ''
        }
      }
    );

    try {
      const updatePath = `serviceRows.${serviceName}.${parseInt(rowIndex)}.data.${columnName}`;
      await Client.findByIdAndUpdate(clientId, { $set: { [updatePath]: 'white' } });
    } catch (updateError) {
      console.error('Error updating client.serviceRows:', updateError);
    }

    res.status(200).json({ success: true, message: 'File removed successfully' });
  } catch (error) {
    console.error('Error removing file:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
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

// POST - Batch update multiple cells
router.post('/update-batch', async (req, res) => {
  try {
    const { clientId, updates } = req.body;

    if (!clientId || !Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({ success: false, message: 'Missing clientId or updates' });
    }

    const client = await Client.findById(clientId);
    if (!client) return res.status(404).json({ success: false, message: 'Client not found' });

    // Group by period
    const byPeriod = new Map();
    for (const u of updates) {
      if (!byPeriod.has(u.period)) byPeriod.set(u.period, []);
      byPeriod.get(u.period).push(u);
    }

    for (const [period, periodUpdates] of byPeriod.entries()) {
      const setObj = {};

      for (const u of periodUpdates) {
        const { serviceName, rowIndex, columnName, color } = u;
        const rowKey = String(rowIndex);
        const path = `services.${serviceName}.rows.${rowKey}.columns.${columnName}.color`;
        setObj[path] = color;
      }

      await Status.updateOne(
        { clientId, period },
        {
          $set: setObj,
          $setOnInsert: { clientId, period }
        },
        { upsert: true }
      );
    }

    res.status(200).json({ success: true, message: 'Batch status updated' });
  } catch (error) {
    console.error('❌ Batch update error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

export default router;