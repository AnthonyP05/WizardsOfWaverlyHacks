import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');

    // Use self-signed HTTPS if certs exist (needed for camera on mobile)
    const certPath = path.resolve(__dirname, 'certs');
    const httpsConfig = fs.existsSync(path.join(certPath, 'key.pem'))
      ? {
          key: fs.readFileSync(path.join(certPath, 'key.pem')),
          cert: fs.readFileSync(path.join(certPath, 'cert.pem')),
        }
      : undefined;

    return {
      server: {
        port: 3001,
        host: '0.0.0.0',
        https: httpsConfig,
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});