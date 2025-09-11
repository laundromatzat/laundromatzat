import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path'

export default defineConfig({
  plugins: [react()],
  // IMPORTANT: use your actual repo name here
  base: '/laundromatzat/', 
});