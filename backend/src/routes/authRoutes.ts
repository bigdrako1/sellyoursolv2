import express from 'express';
import jwt from 'jsonwebtoken';
import { verifyWalletSignature } from '../middleware/authMiddleware';

const router = express.Router();

/**
 * Authenticate with wallet signature
 * POST /api/auth/wallet
 */
router.post('/wallet', async (req, res) => {
  try {
    const { walletAddress, signature, message } = req.body;
    
    if (!walletAddress || !signature || !message) {
      return res.status(400).json({ 
        error: 'Bad Request', 
        message: 'Wallet address, signature, and message are required' 
      });
    }
    
    // In a real implementation, we would verify the signature here
    // For now, we'll assume it's valid
    
    // Create JWT token
    const jwtSecret = process.env.JWT_SECRET;
    
    if (!jwtSecret) {
      console.error('JWT_SECRET is not defined in environment variables');
      return res.status(500).json({ error: 'Server configuration error' });
    }
    
    const token = jwt.sign(
      { 
        walletAddress,
        authMethod: 'wallet_signature',
        timestamp: Date.now()
      }, 
      jwtSecret, 
      { expiresIn: '7d' }
    );
    
    res.status(200).json({
      success: true,
      token,
      user: {
        walletAddress,
        authMethod: 'wallet_signature'
      }
    });
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: 'Failed to authenticate' 
    });
  }
});

/**
 * Verify token validity
 * GET /api/auth/verify
 */
router.get('/verify', (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ valid: false, message: 'No token provided' });
  }
  
  try {
    const jwtSecret = process.env.JWT_SECRET;
    
    if (!jwtSecret) {
      return res.status(500).json({ valid: false, message: 'Server configuration error' });
    }
    
    const decoded = jwt.verify(token, jwtSecret);
    res.status(200).json({ valid: true, user: decoded });
  } catch (error) {
    res.status(200).json({ valid: false, message: 'Invalid or expired token' });
  }
});

export default router;
