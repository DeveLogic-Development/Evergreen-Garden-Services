import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from '@/App';
import 'swiper/css';
import 'swiper/css/effect-fade';
import 'swiper/css/pagination';
import '@/styles/index.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Missing root element');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
