
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { testHeliusConnection } from './services/tokenDataService'

// Check API connection on start
testHeliusConnection()
  .then(connected => {
    console.log('Helius API connection:', connected ? 'OK' : 'Failed');
  })
  .catch(err => {
    console.error('Error checking API connection:', err);
  });

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
