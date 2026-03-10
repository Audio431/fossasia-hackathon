/**
 * Alert Routes
 * Handles alert delivery from extension to parents
 */

const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const { sendEmailAlert } = require('../services/email');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

/**
 * POST /v1/alerts
 * Receive alert from extension and deliver to parent
 */
router.post('/', async (req, res) => {
  try {
    const { apiKey, alert, childId } = req.body;

    // Validate request
    if (!apiKey || !alert) {
      return res.status(400).json({ error: 'Missing required fields: apiKey, alert' });
    }

    // Verify API key and get parent info
    const parentResult = await pool.query(
      'SELECT * FROM parents WHERE api_key = $1',
      [apiKey]
    );

    if (parentResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    const parent = parentResult.rows[0];

    // Verify child belongs to this parent
    const childResult = await pool.query(
      'SELECT * FROM children WHERE device_id = $1 AND parent_id = $2',
      [childId, parent.id]
    );

    let childIdUuid;
    if (childResult.rows.length === 0) {
      // Create new child record
      const newChildResult = await pool.query(
        'INSERT INTO children (parent_id, device_id) VALUES ($1, $2) RETURNING id',
        [parent.id, childId]
      );
      childIdUuid = newChildResult.rows[0].id;
    } else {
      childIdUuid = childResult.rows[0].id;
    }

    // Store alert
    const alertResult = await pool.query(
      `INSERT INTO alerts (child_id, risk_score, risk_level, reasons, recommendations, url, website, platform, timestamp)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id`,
      [
        childIdUuid,
        alert.riskScore,
        alert.riskLevel,
        JSON.stringify(alert.reasons),
        JSON.stringify(alert.recommendations || []),
        alert.url,
        alert.website,
        alert.platform,
        new Date(alert.timestamp)
      ]
    );

    const storedAlert = alertResult.rows[0];

    // Check if parent should be notified
    const preferences = parent.preferences || {};
    const shouldNotify = alert.riskScore >= (preferences.alertThreshold || 50);

    if (shouldNotify) {
      // Send email notification
      if (preferences.emailAlerts !== false) {
        try {
          await sendEmailAlert(parent.email, {
            ...alert,
            id: storedAlert.id,
            childName: childResult.rows[0]?.name || 'Your child',
          });

          // Mark as sent
          await pool.query(
            'UPDATE alerts SET sent_to_parent = true WHERE id = $1',
            [storedAlert.id]
          );
        } catch (emailError) {
          console.error('Failed to send email:', emailError);
          // Don't fail the request if email fails
        }
      }
    }

    res.json({
      success: true,
      alertId: storedAlert.id,
      notified: shouldNotify
    });

  } catch (error) {
    console.error('Error creating alert:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /v1/alerts/:parentId
 * Get all alerts for a parent
 */
router.get('/:parentId', async (req, res) => {
  try {
    const { parentId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const result = await pool.query(
      `SELECT a.*, c.name as child_name, c.device_id
       FROM alerts a
       JOIN children c ON a.child_id = c.id
       WHERE c.parent_id = $1
       ORDER BY a.created_at DESC
       LIMIT $2 OFFSET $3`,
      [parentId, limit, offset]
    );

    res.json({ alerts: result.rows });

  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PATCH /v1/alerts/:alertId/acknowledge
 * Acknowledge an alert
 */
router.patch('/:alertId/acknowledge', async (req, res) => {
  try {
    const { alertId } = req.params;

    await pool.query(
      'UPDATE alerts SET acknowledged = true WHERE id = $1',
      [alertId]
    );

    res.json({ success: true });

  } catch (error) {
    console.error('Error acknowledging alert:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
