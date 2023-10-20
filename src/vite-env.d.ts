/// <reference types="vite/client" />
interface ImportMetaEnv {
  readonly VITE_REACT_APP_USER_POOL_ID: string
  readonly VITE_REACT_APP_USER_POOL_CLIENT_ID: string
  readonly VITE_REACT_APP_IDENTITY_POOL_ID: string
  readonly VITE_REACT_APP_AWS_REGION: string 
  readonly VITE_TRANSCRIBE_LANGUAGE_CODE: string
  readonly VITE_TRANSCRIBE_SAMPLING_RATE: number
  readonly VITE_TRANSCRIBE_AUDIO_SOURCE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}