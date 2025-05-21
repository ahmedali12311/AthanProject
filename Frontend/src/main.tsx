import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { TimeThemeProvider } from './contexts/TimeThemeContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <TimeThemeProvider>
        <App />
      </TimeThemeProvider>
    </BrowserRouter>
  </StrictMode>
);