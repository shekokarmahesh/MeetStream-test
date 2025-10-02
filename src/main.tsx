import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Suppress MCP library logs
const originalLog = console.log;

console.log = (...args) => {
  const message = args[0];
  // Filter out useMcp logs
  if (typeof message === 'string' && message.includes('[useMcp]')) {
    return;
  }
  originalLog.apply(console, args);
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
