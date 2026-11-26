import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.colony.gestion',
  appName: 'COLONY GESTION',
  webDir: 'dist',
  bundledWebRuntime: false,
  android: {
    allowMixedContent: false,
  },
  plugins: {
    CapacitorUpdater: {
      appId: 'com.colony.gestion',
      defaultChannel: 'production',
      autoUpdate: 'atBackground',
      resetWhenUpdate: false,
    },
  },
};

export default config;
