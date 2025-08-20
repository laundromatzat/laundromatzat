import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // The 'define' block for environment variables is no longer needed
  // if you use the VITE_ prefix for your variables.
  // Vite automatically handles them.
  base: '/', // Ensures correct asset paths for custom domain deployment
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    }
  }
})
