import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware';
import fetch from 'node-fetch';

const router = express.Router();

// Get API key from environment variables
const HELIUS_API_KEY = process.env.HELIUS_API_KEY;
const HELIUS_API_BASE = process.env.HELIUS_API_BASE || 'https://api.helius.xyz/v0';
const HELIUS_RPC_URL = process.env.HELIUS_RPC_URL || 'https://mainnet.helius-rpc.com';

// Middleware to check if API key is configured
const checkApiKey = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (!HELIUS_API_KEY) {
    return res.status(500).json({
      error: 'Server Configuration Error',
      message: 'Helius API key is not configured'
    });
  }
  next();
};

// Apply middleware to all routes
router.use(checkApiKey);

/**
 * Proxy for Helius RPC calls
 * POST /api/helius/rpc
 */
router.post('/rpc', authenticateToken, async (req, res) => {
  try {
    const { method, params } = req.body;

    if (!method) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Method is required'
      });
    }

    const response = await fetch(`${HELIUS_RPC_URL}/?api-key=${HELIUS_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: `proxy-${Date.now()}`,
        method,
        params: params || []
      })
    });

    if (!response.ok) {
      throw new Error(`Helius API error: ${response.statusText}`);
    }

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error('Helius RPC proxy error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Proxy for Helius API endpoints
 * POST /api/helius/:endpoint
 */
router.post('/:endpoint', authenticateToken, async (req, res) => {
  try {
    const { endpoint } = req.params;
    const data = req.body;

    const response = await fetch(`${HELIUS_API_BASE}/${endpoint}?api-key=${HELIUS_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`Helius API error: ${response.statusText}`);
    }

    const responseData = await response.json();
    res.status(200).json(responseData);
  } catch (error) {
    console.error('Helius API proxy error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Test connection to Helius API
 * GET /api/helius/test-connection
 */
router.get('/test-connection', async (req, res) => {
  try {
    const startTime = Date.now();

    const response = await fetch(`${HELIUS_RPC_URL}/?api-key=${HELIUS_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'connection-test',
        method: 'getHealth',
      })
    });

    const latency = Date.now() - startTime;

    if (!response.ok) {
      return res.status(200).json({
        connected: false,
        latency,
        message: `API responded with status: ${response.status}`
      });
    }

    const data = await response.json();
    // Type assertion to handle the unknown type
    const result = data as { result?: string | number };
    const connected = result.result === "ok" || result.result === 1;

    res.status(200).json({
      connected,
      latency,
      message: connected ? 'Successfully connected to Helius API' : 'Failed to connect to Helius API'
    });
  } catch (error) {
    console.error('Helius connection test error:', error);
    res.status(200).json({
      connected: false,
      latency: 0,
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
