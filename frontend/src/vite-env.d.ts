/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_APP_TITLE: string
  }
  
  interface ImportMeta {
    readonly env: ImportMetaEnv;
    glob(pattern: string, options?: { eager: boolean }): Record<string, any>;
  }