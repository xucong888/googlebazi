import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App, { ErrorBoundary } from './App.tsx';
import { PointsProvider } from './points';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <PointsProvider>
        <App />
      </PointsProvider>
    </ErrorBoundary>
  </StrictMode>,
);
