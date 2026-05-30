import { createRoot } from 'react-dom/client'
import App from './App.tsx'

// Ocultar splash estático de index.html con transición suave
const splash = document.getElementById('splash-root');
if (splash) {
  splash.classList.add('splash-hidden');
  setTimeout(() => splash.remove(), 500);
}

createRoot(document.getElementById('root')!).render(
    <App />
)
