/**
 * Feedback Routes
 * Handles parent feedback for ML model training
 */

const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

/**
 * POST /v1/feedback
 * Submit feedback about whether a detected stranger was actually a stranger
 */
router.post('/', async (req, res) => {
  try {
    const { alertId, isStranger, apiKey } = req.body;

    // Validate request
    if (!alertId || typeof isStranger !== 'boolean') {
      return res.status(400).json({ error: 'Missing required fields: alertId, isStranger' });
    }

    // Verify API key and get parent ID
    let parentId;
    if (apiKey) {
      const parentResult = await pool.query(
        'SELECT id FROM parents WHERE api_key = $1',
        [apiKey]
      );
      if (parentResult.rows.length > 0) {
        parentId = parentResult.rows[0].id;
      }
    }

    // Store feedback
    const result = await pool.query(
      'INSERT INTO feedback (alert_id, is_stranger, parent_id) VALUES ($1, $2, $3) RETURNING id',
      [alertId, isStranger, parentId]
    );

    // Get alert details for training data
    const alertResult = await pool.query(
      'SELECT * FROM alerts WHERE id = $1',
      [alertId]
    );

    if (alertResult.rows.length > 0) {
      const alert = alertResult.rows[0];

      // Store anonymized training data
      await pool.query(
        `INSERT INTO training_data (features, label_is_stranger, source_feedback_id, anonymized)
         VALUES ($1, $2, $3, true)`,
        [
          JSON.stringify({
            risk_score: alert.risk_score,
            risk_level: alert.risk_level,
            platform: alert.platform,
            reasons: alert.reasons,
          }),
          isStranger,
          result.rows[0].id
        ]
      );
    }

    res.json({
      success: true,
      feedbackId: result.rows[0].id,
      message: 'Thank you for your feedback!'
    });

  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /v1/feedback/training
 * Get anonymized training data for ML model (protected endpoint)
 */
router.get('/training', async (req, res) => {
  try {
    // In production, this should be protected with admin authentication
    const result = await pool.query(
      'SELECT features, label_is_stranger FROM training_data WHERE label_is_stranger IS NOT NULL AND anonymized = true'
    );

    res.json({
      trainingData: result.rows,
      count: result.rows.length
    });

  } catch (error) {
    console.error('Error fetching training data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
