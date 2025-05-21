import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware';
import fetch from 'node-fetch';

const router = express.Router();

// Get API key from environment variables
const BIRDEYE_API_KEY = process.env.BIRDEYE_API_KEY || 'placeholder_birdeye_api_key';
const BIRDEYE_API_BASE = process.env.BIRDEYE_API_BASE || 'https://public-api.birdeye.so';

// Middleware to check if API key is configured
const checkApiKey = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (!BIRDEYE_API_KEY) {
    return res.status(500).json({
      error: 'Server Configuration Error',
      message: 'Birdeye API key is not configured'
    });
  }
  next();
};

// Apply middleware to all routes
router.use(checkApiKey);

/**
 * Proxy for Birdeye API endpoints
 * GET /api/birdeye/:endpoint
 */
router.get('/:endpoint', authenticateToken, async (req, res) => {
  try {
    const { endpoint } = req.params;
    const queryParams = new URLSearchParams(req.query as Record<string, string>).toString();

    const url = `${BIRDEYE_API_BASE}/${endpoint}?${queryParams}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': BIRDEYE_API_KEY
      }
    });

    if (!response.ok) {
      throw new Error(`Birdeye API error: ${response.statusText}`);
    }

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error('Birdeye API proxy error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Proxy for Birdeye API POST endpoints
 * POST /api/birdeye/:endpoint
 */
router.post('/:endpoint', authenticateToken, async (req, res) => {
  try {
    const { endpoint } = req.params;
    const data = req.body;

    const response = await fetch(`${BIRDEYE_API_BASE}/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': BIRDEYE_API_KEY
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`Birdeye API error: ${response.statusText}`);
    }

    const responseData = await response.json();
    res.status(200).json(responseData);
  } catch (error) {
    console.error('Birdeye API proxy error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
