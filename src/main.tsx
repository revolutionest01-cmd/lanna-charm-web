import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Unregister any existing service workers to prevent caching issues
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => {
      registration.unregister();
    });
  });
}

// Clear old cache when app version changes
const APP_VERSION = 'v1.0.1';
const STORED_VERSION = localStorage.getItem('app_version');

if (STORED_VERSION !== APP_VERSION) {
  // Clear all caches
  if ('caches' in window) {
    caches.keys().then((names) => {
      names.forEach((name) => {
        caches.delete(name);
      });
    });
  }
  
  // Update stored version
  localStorage.setItem('app_version', APP_VERSION);
  
  // Force reload to get fresh content
  if (STORED_VERSION !== null) {
    window.location.reload();
  }
}

createRoot(document.getElementById("root")!).render(<App />);
