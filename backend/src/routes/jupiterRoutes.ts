import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware';
import fetch from 'node-fetch';

const router = express.Router();

const JUPITER_API_BASE = process.env.JUPITER_API_BASE || 'https://price.jup.ag/v4';

/**
 * Get token price
 * GET /api/jupiter/price
 */
router.get('/price', async (req, res) => {
  try {
    const { ids } = req.query;
    
    if (!ids) {
      return res.status(400).json({ 
        error: 'Bad Request', 
        message: 'Token IDs are required' 
      });
    }
    
    const response = await fetch(`${JUPITER_API_BASE}/price?ids=${ids}`);
    
    if (!response.ok) {
      throw new Error(`Jupiter API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error('Jupiter API proxy error:', error);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

/**
 * Get token price with 24h change
 * GET /api/jupiter/price-with-change
 */
router.get('/price-with-change', async (req, res) => {
  try {
    const { ids } = req.query;
    
    if (!ids) {
      return res.status(400).json({ 
        error: 'Bad Request', 
        message: 'Token IDs are required' 
      });
    }
    
    const response = await fetch(`${JUPITER_API_BASE}/price?ids=${ids}`);
    
    if (!response.ok) {
      throw new Error(`Jupiter API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error('Jupiter API proxy error:', error);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

export default router;
