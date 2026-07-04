import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Served from https://<user>.github.io/LockCrackGame/ in production.
export default defineConfig({
  base: process.env.GITHUB_PAGES ? '/LockCrackGame/' : '/',
  plugins: [react()],
})
