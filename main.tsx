import { createRoot } from 'react-dom/client';
import Home from './app/page';
import './app/globals.css';
import './app/theme.css';
import './app/mobile-compat.css';

createRoot(document.getElementById('root')!).render(<Home />);
