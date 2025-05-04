
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Simulated endpoint for a Solana RPC connection
const HELIUS_API_KEY = 'a18d2c93-d9fa-4db2-8419-707a4f1782f7';
const SOLANA_RPC_URL = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;

// Initialize global services for token monitoring
const initTokenMonitoring = async () => {
  try {
    console.log('Initializing token monitoring services...');
    console.log(`Connecting to Solana RPC at ${SOLANA_RPC_URL}`);
    
    // In real implementation, this would initialize a Solana connection
    // const connection = new Connection(SOLANA_RPC_URL);
    
    console.log('Starting Webhook monitoring service...');
    // Would initialize webhook listeners
    
    console.log('Token monitoring initialization complete');
  } catch (error) {
    console.error('Failed to initialize token monitoring:', error);
  }
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
