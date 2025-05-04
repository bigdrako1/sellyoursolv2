
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { testHeliusConnection } from './services/tokenDataService';

// Helius API configuration
const HELIUS_API_KEY = 'a18d2c93-d9fa-4db2-8419-707a4f1782f7';
const SOLANA_RPC_URL = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;
const SECURE_RPC_URL = 'https://christye-baw30v-fast-mainnet.helius-rpc.com';

// Initialize global services for token monitoring
const initTokenMonitoring = async () => {
  try {
    console.log('Initializing token monitoring services...');
    console.log(`Connecting to Solana RPC at ${SOLANA_RPC_URL}`);
    
    // Test Helius connection
    const isConnected = await testHeliusConnection();
    console.log(`Helius connection test: ${isConnected ? 'Success' : 'Failed'}`);
    
    // Check for stored API key
    const storedApiKey = localStorage.getItem('helius_api_key');
    if (storedApiKey) {
      console.log('Using stored Helius API key');
    } else {
      console.log('No stored Helius API key found. Using default key.');
      localStorage.setItem('helius_api_key', HELIUS_API_KEY);
    }
    
    // Initialize webhooks
    console.log('Starting Webhook monitoring service...');
    initializeWebhooks();
    
    // Initialize token quality filter
    console.log('Initializing token quality filter...');
    initializeTokenQualityFilter();
    
    // Set up token watchlist listeners
    console.log('Setting up watchlist price monitoring...');
    setupWatchlistMonitoring();
    
    // Initialize smart money tracking
    console.log('Initializing smart money tracking...');
    initializeSmartMoneyTracking();
    
    // Initialize Telegram channel monitoring
    console.log('Initializing Telegram channel monitoring...');
    initializeTelegramMonitoring();
    
    console.log('Token monitoring initialization complete');
  } catch (error) {
    console.error('Failed to initialize token monitoring:', error);
  }
};

// Initialize webhooks for token activity
const initializeWebhooks = () => {
  // In a real implementation, this would register webhooks with Helius
  // For now, we'll simulate webhook registration
  console.log('Registering webhooks for token activity monitoring');
  
  const webhookTypes = [
    'new_token',
    'token_price_change',
    'smart_money_activity',
    'whale_transaction'
  ];
  
  webhookTypes.forEach(type => {
    console.log(`Registered webhook for ${type} events`);
  });
};

// Initialize token quality filter with scoring parameters
const initializeTokenQualityFilter = () => {
  // Define default quality filter settings
  const defaultQualitySettings = {
    minLiquidity: 10000,
    minHolders: 50,
    maxPrice: null,
    minPrice: null,
    suspiciousPatterns: [
      'scam', 'rug', 'honeypot', 'ponzi', 'fake', 'test'
    ],
    qualityThresholds: {
      high: 80,
      good: 70,
      average: 50,
      low: 30
    }
  };
  
  // Store default settings if not already set
  if (!localStorage.getItem('quality_filter_settings')) {
    localStorage.setItem('quality_filter_settings', JSON.stringify(defaultQualitySettings));
  }
  
  console.log('Token quality filter initialized with default settings');
};

// Setup watchlist price monitoring
const setupWatchlistMonitoring = () => {
  console.log('Setting up price monitoring for watchlisted tokens');
  
  // Set up periodic checking (every 5 minutes in a real app)
  const checkInterval = 300000; // 5 minutes
  
  // For demo purposes, we'll use a shorter interval
  const demoInterval = 30000; // 30 seconds
  
  // We simulate this with a setTimeout instead of actually setting up interval
  // to avoid background processing in the demo
  setTimeout(() => {
    console.log('Periodic watchlist price check triggered');
  }, demoInterval);
};

// Initialize Smart Money tracking system
const initializeSmartMoneyTracking = () => {
  console.log('Setting up Smart Money wallet tracking');
  
  // Define smart money wallets to track
  const smartMoneyWallets = [
    "3FTHyP7TLcqd6C969eGHQ2QfnpRFmfqbKA2MnzTcf3j9",
    "6Dkr4HJLo9XavxrJpsMcky2rKzKJP3wgpuP9mJbYekbV",
    "9AYmFnSdDDYEa5EaZJU8yCQmxpGwhEbgKU7SdeQDiEsZ"
  ];
  
  // Store smart money wallets if not already set
  if (!localStorage.getItem('smart_money_wallets')) {
    localStorage.setItem('smart_money_wallets', JSON.stringify(smartMoneyWallets));
  }
  
  // Create or ensure smart money alerts storage
  if (!localStorage.getItem('smart_money_alerts')) {
    localStorage.setItem('smart_money_alerts', JSON.stringify([]));
  }
  
  console.log('Smart Money tracking initialized with default wallets');
};

// Initialize Telegram channel monitoring system
const initializeTelegramMonitoring = () => {
  console.log('Setting up Telegram channel monitoring');
  
  // Check if channels already configured
  if (!localStorage.getItem('telegram_channels')) {
    // Define default channels to monitor
    const defaultChannels = [
      { id: "channel-1", name: "CYRILXBT GAMBLING", channelId: "-1002022554106", enabled: true, lastChecked: new Date().toISOString(), messageCount: 0 },
      { id: "channel-2", name: "MAGIC1000x BOT", channelId: "7583670120", enabled: true, lastChecked: new Date().toISOString(), messageCount: 0 },
      { id: "channel-3", name: "GMGN ALERT BOT 1", channelId: "6917338381", enabled: true, lastChecked: new Date().toISOString(), messageCount: 0 },
      { id: "channel-4", name: "SMART MONEY BUYS", channelId: "7438902115", enabled: true, lastChecked: new Date().toISOString(), messageCount: 0 },
      { id: "channel-5", name: "MEME1000X", channelId: "-1002333406905", enabled: true, lastChecked: new Date().toISOString(), messageCount: 0 },
      { id: "channel-6", name: "SOLANA ACTIVITY TRACKER", channelId: "-1002270988204", enabled: true, lastChecked: new Date().toISOString(), messageCount: 0 },
    ];
    
    localStorage.setItem('telegram_channels', JSON.stringify(defaultChannels));
  }
  
  // Initialize message storage if not present
  if (!localStorage.getItem('telegram_messages')) {
    localStorage.setItem('telegram_messages', JSON.stringify([]));
  }
  
  console.log('Telegram channel monitoring initialized');
};

// Initialize any global services or configurations
const initApp = () => {
  // Initialize token monitoring service
  initTokenMonitoring().catch(console.error);
  
  // Create root and render App
  const rootElement = document.getElementById("root");
  if (!rootElement) throw new Error("Failed to find the root element");

  const root = createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
};

// Start the application
initApp();
