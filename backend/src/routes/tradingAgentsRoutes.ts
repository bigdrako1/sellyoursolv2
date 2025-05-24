import express from 'express';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Base URL for the Python trading agents service
const TRADING_AGENTS_SERVICE_URL = process.env.TRADING_AGENTS_SERVICE_URL || 'http://localhost:8000';

/**
 * Proxy requests to the Python trading agents service
 */
const proxyToTradingAgentsService = async (req: express.Request, res: express.Response, endpoint: string, method: string = 'GET') => {
  try {
    const url = `${TRADING_AGENTS_SERVICE_URL}${endpoint}`;
    const queryParams = new URLSearchParams(req.query as Record<string, string>).toString();
    const fullUrl = queryParams ? `${url}?${queryParams}` : url;

    const fetchOptions: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (method !== 'GET' && req.body) {
      fetchOptions.body = JSON.stringify(req.body);
    }

    const response = await fetch(fullUrl, fetchOptions);

    if (!response.ok) {
      throw new Error(`Trading agents service error: ${response.statusText}`);
    }

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Trading agents proxy error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
};

/**
 * Get all trading agents
 * GET /api/trading-agents
 */
router.get('/', authenticateToken, async (req, res) => {
  await proxyToTradingAgentsService(req, res, '/agents', 'GET');
});

/**
 * Create a new trading agent
 * POST /api/trading-agents
 */
router.post('/', authenticateToken, async (req, res) => {
  await proxyToTradingAgentsService(req, res, '/agents', 'POST');
});

/**
 * Get available agent types
 * GET /api/trading-agents/types
 */
router.get('/types', authenticateToken, async (req, res) => {
  await proxyToTradingAgentsService(req, res, '/agents/types', 'GET');
});

/**
 * Health check for trading agents service
 * GET /api/trading-agents/health
 */
router.get('/health', async (req, res) => {
  try {
    const response = await fetch(`${TRADING_AGENTS_SERVICE_URL}/health`);

    if (!response.ok) {
      throw new Error(`Health check failed: ${response.statusText}`);
    }

    const data = await response.json();
    res.status(200).json({
      status: 'ok',
      trading_agents_service: data,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Trading agents health check error:', error);
    res.status(503).json({
      status: 'error',
      message: 'Trading agents service unavailable',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Get a specific trading agent
 * GET /api/trading-agents/:id
 */
router.get('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  await proxyToTradingAgentsService(req, res, `/agents/${id}`, 'GET');
});

/**
 * Update a trading agent
 * PUT /api/trading-agents/:id
 */
router.put('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  await proxyToTradingAgentsService(req, res, `/agents/${id}`, 'PUT');
});

/**
 * Delete a trading agent
 * DELETE /api/trading-agents/:id
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  await proxyToTradingAgentsService(req, res, `/agents/${id}`, 'DELETE');
});

/**
 * Start a trading agent
 * POST /api/trading-agents/:id/start
 */
router.post('/:id/start', authenticateToken, async (req, res) => {
  const { id } = req.params;
  await proxyToTradingAgentsService(req, res, `/agents/${id}/start`, 'POST');
});

/**
 * Stop a trading agent
 * POST /api/trading-agents/:id/stop
 */
router.post('/:id/stop', authenticateToken, async (req, res) => {
  const { id } = req.params;
  await proxyToTradingAgentsService(req, res, `/agents/${id}/stop`, 'POST');
});

/**
 * Get agent status
 * GET /api/trading-agents/:id/status
 */
router.get('/:id/status', authenticateToken, async (req, res) => {
  const { id } = req.params;
  await proxyToTradingAgentsService(req, res, `/agents/${id}/status`, 'GET');
});

/**
 * Execute an action on a trading agent
 * POST /api/trading-agents/:id/execute
 */
router.post('/:id/execute', authenticateToken, async (req, res) => {
  const { id } = req.params;
  await proxyToTradingAgentsService(req, res, `/agents/${id}/execute`, 'POST');
});

/**
 * Get agent logs
 * GET /api/trading-agents/:id/logs
 */
router.get('/:id/logs', authenticateToken, async (req, res) => {
  const { id } = req.params;
  await proxyToTradingAgentsService(req, res, `/agents/${id}/logs`, 'GET');
});

/**
 * Create Python bot agents from existing bot files
 * POST /api/trading-agents/create-python-bots
 */
router.post('/create-python-bots', authenticateToken, async (req, res) => {
  try {
    const pythonBots = [
      {
        name: 'Copy Trading Bot',
        agent_type: 'copy_trading',
        config: {
          script_path: 'copybot.py',
          max_positions: 10,
          usdc_size: 100,
          days_back: 1,
          tp_multiplier: 2.0,
          sl_percentage: -0.5
        }
      },
      {
        name: 'SOL Scanner',
        agent_type: 'sol_scanner',
        config: {
          script_path: 'solscanner.py',
          new_token_hours: 3,
          min_liquidity: 10000,
          max_top10_holder_percent: 0.3,
          drop_if_no_website: false,
          drop_if_no_twitter: false
        }
      },
      {
        name: 'HyperLiquid Trading Bot',
        agent_type: 'hyperliquid_trading',
        config: {
          script_path: 'hyperliquid_trading_bot.py',
          order_usd_size: 10,
          leverage: 3,
          timeframe: '4h',
          symbols: ['WIF'],
          liquidation_threshold: 10000
        }
      },
      {
        name: 'Sniper Bot',
        agent_type: 'sniper',
        config: {
          script_path: 'sniperbot.py',
          usdc_size: 100,
          max_positions: 5,
          sell_at_multiple: 4.0,
          sell_amount_perc: 0.8,
          max_top10_holder_percent: 0.3,
          drop_if_mutable_metadata: true
        }
      }
    ];

    const createdAgents = [];

    for (const bot of pythonBots) {
      try {
        const response = await fetch(`${TRADING_AGENTS_SERVICE_URL}/agents`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(bot),
        });

        if (response.ok) {
          const agent = await response.json();
          createdAgents.push(agent);
        } else {
          console.error(`Failed to create ${bot.name}:`, await response.text());
        }
      } catch (error) {
        console.error(`Error creating ${bot.name}:`, error);
      }
    }

    res.status(200).json({
      success: true,
      message: `Created ${createdAgents.length} trading agents`,
      agents: createdAgents
    });
  } catch (error) {
    console.error('Error creating Python bot agents:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

/**
 * Get Python bot configurations
 * GET /api/trading-agents/python-bots/config
 */
router.get('/python-bots/config', authenticateToken, async (req, res) => {
  try {
    const pythonBotConfigs = {
      copy_trading: {
        name: 'Copy Trading Bot',
        description: 'Automatically copies trades from successful wallets and smart money movements',
        file: 'copybot.py',
        defaultConfig: {
          max_positions: 10,
          usdc_size: 100,
          days_back: 1,
          tp_multiplier: 2.0,
          sl_percentage: -0.5
        },
        configSchema: {
          max_positions: { type: 'number', min: 1, max: 50, description: 'Maximum number of open positions' },
          usdc_size: { type: 'number', min: 10, max: 10000, description: 'USDC size per trade' },
          days_back: { type: 'number', min: 0, max: 7, description: 'Days back to analyze transactions' },
          tp_multiplier: { type: 'number', min: 1.1, max: 10, description: 'Take profit multiplier' },
          sl_percentage: { type: 'number', min: -0.9, max: -0.1, description: 'Stop loss percentage' }
        }
      },
      sol_scanner: {
        name: 'SOL Scanner',
        description: 'Scans for new token launches and trending tokens on Solana with quality filters',
        file: 'solscanner.py',
        defaultConfig: {
          new_token_hours: 3,
          min_liquidity: 10000,
          max_top10_holder_percent: 0.3,
          drop_if_no_website: false,
          drop_if_no_twitter: false
        },
        configSchema: {
          new_token_hours: { type: 'number', min: 1, max: 24, description: 'Hours to look back for new tokens' },
          min_liquidity: { type: 'number', min: 1000, max: 1000000, description: 'Minimum liquidity threshold' },
          max_top10_holder_percent: { type: 'number', min: 0.1, max: 0.9, description: 'Maximum top 10 holder percentage' },
          drop_if_no_website: { type: 'boolean', description: 'Drop tokens without website' },
          drop_if_no_twitter: { type: 'boolean', description: 'Drop tokens without Twitter' }
        }
      },
      hyperliquid_trading: {
        name: 'HyperLiquid Trading Bot',
        description: 'Trades liquidations and market inefficiencies on HyperLiquid exchange',
        file: 'hyperliquid_trading_bot.py',
        defaultConfig: {
          order_usd_size: 10,
          leverage: 3,
          timeframe: '4h',
          symbols: ['WIF'],
          liquidation_threshold: 10000
        },
        configSchema: {
          order_usd_size: { type: 'number', min: 1, max: 1000, description: 'Order size in USD' },
          leverage: { type: 'number', min: 1, max: 10, description: 'Trading leverage' },
          timeframe: { type: 'string', enum: ['1m', '5m', '15m', '1h', '4h', '1d'], description: 'Trading timeframe' },
          symbols: { type: 'array', description: 'Trading symbols' },
          liquidation_threshold: { type: 'number', min: 1000, max: 1000000, description: 'Liquidation threshold' }
        }
      },
      sniper: {
        name: 'Sniper Bot',
        description: 'Snipes new token launches with advanced security checks and filters',
        file: 'sniperbot.py',
        defaultConfig: {
          usdc_size: 100,
          max_positions: 5,
          sell_at_multiple: 4.0,
          sell_amount_perc: 0.8,
          max_top10_holder_percent: 0.3,
          drop_if_mutable_metadata: true
        },
        configSchema: {
          usdc_size: { type: 'number', min: 10, max: 10000, description: 'USDC size per snipe' },
          max_positions: { type: 'number', min: 1, max: 20, description: 'Maximum open positions' },
          sell_at_multiple: { type: 'number', min: 1.5, max: 20, description: 'Sell at multiple' },
          sell_amount_perc: { type: 'number', min: 0.1, max: 1, description: 'Percentage to sell' },
          max_top10_holder_percent: { type: 'number', min: 0.1, max: 0.9, description: 'Max top 10 holder %' },
          drop_if_mutable_metadata: { type: 'boolean', description: 'Drop if mutable metadata' }
        }
      }
    };

    res.status(200).json(pythonBotConfigs);
  } catch (error) {
    console.error('Error getting Python bot configurations:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

export default router;
