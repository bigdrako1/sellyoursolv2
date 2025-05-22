/**
 * Application configuration.
 */
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export const config = {
  // Server configuration
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // CORS configuration
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  
  // API keys
  heliusApiKey: process.env.HELIUS_API_KEY || '',
  birdeyeApiKey: process.env.BIRDEYE_API_KEY || '',
  
  // Agent service configuration
  agentServiceUrl: process.env.AGENT_SERVICE_URL || 'http://localhost:8000',
  
  // Database configuration
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    name: process.env.DB_NAME || 'sellyoursolv2',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres'
  },
  
  // JWT configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '1d'
  }
};
