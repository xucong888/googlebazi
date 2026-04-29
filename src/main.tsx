import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App, { ErrorBoundary } from './App.tsx';
import { PointsProvider } from './points';
import './index.css';

// 全局错误捕获 — 防止 JS 崩溃时页面全空白
window.addEventListener('error', (e) => {
  const root = document.getElementById('root');
  if (root && !root.children.length) {
    root.innerHTML = `<div style="padding:40px;font-family:sans-serif;color:#333">
      <h2 style="color:#c00">页面加载出错</h2>
      <pre style="background:#f5f5f5;padding:16px;border-radius:8px;overflow:auto;font-size:12px">${e.message}\n${e.error?.stack || ''}</pre>
      <button onclick="location.reload()" style="margin-top:16px;padding:10px 24px;background:#333;color:#fff;border:none;border-radius:6px;cursor:pointer">刷新重试</button>
    </div>`;
  }
});

window.addEventListener('unhandledrejection', (e) => {
  console.error('Unhandled rejection:', e.reason);
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <PointsProvider>
        <App />
      </PointsProvider>
    </ErrorBoundary>
  </StrictMode>,
);
