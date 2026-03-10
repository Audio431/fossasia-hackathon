/**
 * Parent Routes
 * Handles parent registration and management
 */

const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const crypto = require('crypto');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

/**
 * POST /v1/parents/register
 * Register a new parent and generate API key
 */
router.post('/register', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check if parent already exists
    const existingResult = await pool.query(
      'SELECT * FROM parents WHERE email = $1',
      [email]
    );

    if (existingResult.rows.length > 0) {
      // Return existing API key
      return res.json({
        success: true,
        apiKey: existingResult.rows[0].api_key,
        message: 'Account already exists'
      });
    }

    // Generate API key
    const apiKey = `ps_${crypto.randomBytes(32).toString('hex')}`;

    // Insert new parent
    const result = await pool.query(
      'INSERT INTO parents (email, api_key, verified) VALUES ($1, $2, false) RETURNING id, api_key',
      [email, apiKey]
    );

    const parent = result.rows[0];

    // TODO: Send verification email
    console.log(`Verification email should be sent to ${email}`);

    res.json({
      success: true,
      parentId: parent.id,
      apiKey: parent.api_key,
      message: 'Registration successful. Please verify your email.'
    });

  } catch (error) {
    console.error('Error registering parent:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /v1/parents/:apiKey
 * Get parent info by API key
 */
router.get('/:apiKey', async (req, res) => {
  try {
    const { apiKey } = req.params;

    const result = await pool.query(
      'SELECT id, email, preferences, verified, created_at FROM parents WHERE api_key = $1',
      [apiKey]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Parent not found' });
    }

    // Get children
    const childrenResult = await pool.query(
      'SELECT * FROM children WHERE parent_id = $1',
      [result.rows[0].id]
    );

    res.json({
      parent: result.rows[0],
      children: childrenResult.rows
    });

  } catch (error) {
    console.error('Error fetching parent:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PATCH /v1/parents/:apiKey
 * Update parent preferences
 */
router.patch('/:apiKey', async (req, res) => {
  try {
    const { apiKey } = req.params;
    const { preferences } = req.body;

    const result = await pool.query(
      'UPDATE parents SET preferences = COALESCE($1, preferences) WHERE api_key = $2 RETURNING preferences',
      [preferences ? JSON.stringify(preferences) : null, apiKey]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Parent not found' });
    }

    res.json({
      success: true,
      preferences: result.rows[0].preferences
    });

  } catch (error) {
    console.error('Error updating parent:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
