/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_TEXT_AI_API_KEY: string
  readonly VITE_AUDIO_AI_API_KEY: string
  readonly VITE_IMAGE_AI_API_KEY: string
  readonly VITE_APP_NAME: string
  readonly VITE_APP_VERSION: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
