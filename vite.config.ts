import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
export default defineConfig({ plugins: [react()], test:{include:['src/**/*.test.{ts,tsx}','bridge/**/*.test.{ts,mjs}','scripts/**/*.test.mjs']}, build: { chunkSizeWarningLimit: 1700, rollupOptions:{input:{app:'index.html',screensaver:'screensaver.html'}} }, worker: { format: 'es' } });
