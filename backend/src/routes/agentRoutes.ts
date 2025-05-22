/**
 * Routes for managing trading agents.
 */
import express from 'express';
import { AgentService } from '../services/agentService';

const router = express.Router();

/**
 * Get all agents.
 */
router.get('/', async (req, res) => {
  try {
    const agents = await AgentService.getAllAgents();
    res.json(agents);
  } catch (error) {
    console.error('Error getting agents:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get agent by ID.
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const agent = await AgentService.getAgent(id);
    res.json(agent);
  } catch (error) {
    console.error(`Error getting agent ${req.params.id}:`, error);
    
    // Check if it's a 404 error
    if (error instanceof Error && error.message.includes('not found')) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Agent with ID ${req.params.id} not found`
      });
    }
    
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Create a new agent.
 */
router.post('/', async (req, res) => {
  try {
    const { name, type, config } = req.body;
    
    // Validate request body
    if (!name || !type) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Name and type are required'
      });
    }
    
    const agent = await AgentService.createAgent({
      name,
      type,
      config: config || {}
    });
    
    res.status(201).json(agent);
  } catch (error) {
    console.error('Error creating agent:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Update an agent.
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, config } = req.body;
    
    // Validate request body
    if (!name && !config) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'At least one of name or config must be provided'
      });
    }
    
    const agent = await AgentService.updateAgent(id, {
      name,
      config
    });
    
    res.json(agent);
  } catch (error) {
    console.error(`Error updating agent ${req.params.id}:`, error);
    
    // Check if it's a 404 error
    if (error instanceof Error && error.message.includes('not found')) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Agent with ID ${req.params.id} not found`
      });
    }
    
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Delete an agent.
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const success = await AgentService.deleteAgent(id);
    
    if (success) {
      res.status(204).send();
    } else {
      res.status(404).json({
        error: 'Not Found',
        message: `Agent with ID ${id} not found`
      });
    }
  } catch (error) {
    console.error(`Error deleting agent ${req.params.id}:`, error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Start an agent.
 */
router.post('/:id/start', async (req, res) => {
  try {
    const { id } = req.params;
    const agent = await AgentService.startAgent(id);
    res.json(agent);
  } catch (error) {
    console.error(`Error starting agent ${req.params.id}:`, error);
    
    // Check if it's a 404 error
    if (error instanceof Error && error.message.includes('not found')) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Agent with ID ${req.params.id} not found`
      });
    }
    
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Stop an agent.
 */
router.post('/:id/stop', async (req, res) => {
  try {
    const { id } = req.params;
    const agent = await AgentService.stopAgent(id);
    res.json(agent);
  } catch (error) {
    console.error(`Error stopping agent ${req.params.id}:`, error);
    
    // Check if it's a 404 error
    if (error instanceof Error && error.message.includes('not found')) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Agent with ID ${req.params.id} not found`
      });
    }
    
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get agent status.
 */
router.get('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const status = await AgentService.getAgentStatus(id);
    res.json(status);
  } catch (error) {
    console.error(`Error getting agent status ${req.params.id}:`, error);
    
    // Check if it's a 404 error
    if (error instanceof Error && error.message.includes('not found')) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Agent with ID ${req.params.id} not found`
      });
    }
    
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Execute an action on an agent.
 */
router.post('/:id/execute', async (req, res) => {
  try {
    const { id } = req.params;
    const { type, parameters } = req.body;
    
    // Validate request body
    if (!type) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Action type is required'
      });
    }
    
    const result = await AgentService.executeAgentAction(id, type, parameters || {});
    res.json(result);
  } catch (error) {
    console.error(`Error executing action on agent ${req.params.id}:`, error);
    
    // Check if it's a 404 error
    if (error instanceof Error && error.message.includes('not found')) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Agent with ID ${req.params.id} not found`
      });
    }
    
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get agent logs.
 */
router.get('/:id/logs', async (req, res) => {
  try {
    const { id } = req.params;
    const { limit, level } = req.query;
    
    const logs = await AgentService.getAgentLogs(
      id,
      limit ? parseInt(limit as string, 10) : undefined,
      level as string | undefined
    );
    
    res.json(logs);
  } catch (error) {
    console.error(`Error getting agent logs ${req.params.id}:`, error);
    
    // Check if it's a 404 error
    if (error instanceof Error && error.message.includes('not found')) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Agent with ID ${req.params.id} not found`
      });
    }
    
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
