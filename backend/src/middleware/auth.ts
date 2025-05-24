import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    // For development, allow requests without token
    if (process.env.NODE_ENV === 'development') {
      req.user = { id: 'dev-user', email: 'dev@example.com' };
      return next();
    }
    return res.sendStatus(401);
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      // For development, allow invalid tokens
      if (process.env.NODE_ENV === 'development') {
        req.user = { id: 'dev-user', email: 'dev@example.com' };
        return next();
      }
      return res.sendStatus(403);
    }
    req.user = user;
    next();
  });
};

export const generateToken = (user: any) => {
  return jwt.sign(user, JWT_SECRET, { expiresIn: '24h' });
};
