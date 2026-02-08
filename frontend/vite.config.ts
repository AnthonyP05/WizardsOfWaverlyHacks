import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';

export default defineConfig(() => {
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
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});