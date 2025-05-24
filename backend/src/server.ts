import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
// AgentServiceClient removed - using direct proxy approach
import { config } from './config';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { rateLimit } from 'express-rate-limit';

// Import routes
import heliusRoutes from './routes/heliusRoutes';
import jupiterRoutes from './routes/jupiterRoutes';
import birdeyeRoutes from './routes/birdeyeRoutes';
import authRoutes from './routes/authRoutes';
import tradingAgentsRoutes from './routes/tradingAgentsRoutes';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet()); // Security headers
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again after 15 minutes'
});

// Apply rate limiting to all routes
app.use(apiLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/helius', heliusRoutes);
app.use('/api/jupiter', jupiterRoutes);
app.use('/api/birdeye', birdeyeRoutes);
// Unified agent routes - consolidate to single endpoint
app.use('/api/agents', tradingAgentsRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Create HTTP server
const server = http.createServer(app);

// Create Socket.IO server
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

// WebSocket connections will be implemented directly to Python service

// Set up Socket.IO connection handler
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Handle agent subscription
  socket.on('subscribe:agent', async (agentId) => {
    console.log(`Client ${socket.id} subscribed to agent ${agentId}`);

    // Create room for this agent
    socket.join(`agent:${agentId}`);

    // TODO: Implement WebSocket connection to Python service
    // For now, just acknowledge the subscription
    socket.emit('agent:subscribed', { agentId });
  });

  // Handle agent unsubscription
  socket.on('unsubscribe:agent', (agentId) => {
    console.log(`Client ${socket.id} unsubscribed from agent ${agentId}`);
    socket.leave(`agent:${agentId}`);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
