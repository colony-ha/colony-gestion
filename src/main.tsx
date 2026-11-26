import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';
import { StatusBar, Style } from '@capacitor/status-bar';

// Keep Android's status bar (clock, signal and battery) outside the app content.
void StatusBar.setOverlaysWebView({ overlay: false }).catch(() => undefined);
void StatusBar.setBackgroundColor({ color: '#090a09' }).catch(() => undefined);
void StatusBar.setStyle({ style: Style.Light }).catch(() => undefined);
if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => undefined));
ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);