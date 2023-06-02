/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AWS_API_ENDPOINT: string
  readonly VITE_AUTH0_DOMAIN: string
  readonly VITE_SIGNAL_SERVER: string
  readonly VITE_TURN_SERVER: string
  readonly VITE_TURN_USERNAME: string
  readonly VITE_TURN_CREDENTIAL: string
  readonly VITE_AUTH0_APP_CLIENT_ID: string
  readonly VITE_DUMMY_VARIABLE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
