const { resolve } = require('path');
const { defineConfig } = require('vite');

module.exports = defineConfig({
  root: 'public',
  publicDir: false,
  appType: 'mpa',
  base: './',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        index: resolve(__dirname, 'public/index.html'),
        aluno: resolve(__dirname, 'public/aluno.html'),
        professor: resolve(__dirname, 'public/professor.html'),
      },
    },
  },
});
