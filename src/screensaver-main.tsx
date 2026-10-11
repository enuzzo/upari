import { createRoot } from 'react-dom/client';
import Screensaver from './Screensaver';
import './styles.css';
createRoot(document.getElementById('root')!).render(<Screensaver/>);
if('serviceWorker' in navigator&&import.meta.env.PROD)window.addEventListener('load',()=>{navigator.serviceWorker.register('/sw.js').catch(()=>{});});
