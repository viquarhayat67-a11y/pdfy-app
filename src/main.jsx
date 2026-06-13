import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
// Register the PWA Service Worker script seamlessly
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('🚀 PDFy Studio Service Worker registered successfully:', registration.scope);
      })
      .catch((error) => {
        console.error('❌ Service Worker registration failed:', error);
      });
  });
}