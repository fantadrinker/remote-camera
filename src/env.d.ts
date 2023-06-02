/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AWS_API_ENDPOINT: string
  readonly VITE_AUTH0_DOMAIN: string
  readonly VITE_SIGNAL_SERVER: string
  readonly VITE_AUTH0_APP_CLIENT_ID: string
  readonly VITE_ICE_SERVER_API_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
