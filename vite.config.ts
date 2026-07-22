import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base має відповідати назві репозиторію на GitHub Pages, напр.:
// https://username.github.io/slobidska-likarnya/ -> base: '/slobidska-likarnya/'
// Якщо сайт буде на username.github.io (репозиторій без /repo-name), можна замінити на '/'.
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE_PATH ?? '/slobidska-likarnya/',
})
