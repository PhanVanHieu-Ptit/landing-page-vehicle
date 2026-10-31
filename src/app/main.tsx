import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { ErrorBoundary } from '../components/layout';
import '../styles/tokens.css';
import '../styles/global.css';

const root = document.getElementById('root');
if (!root) throw new Error('Application root is missing.');

createRoot(root).render(
  <StrictMode>
    <ErrorBoundary label="The page"><App /></ErrorBoundary>
  </StrictMode>,
);
