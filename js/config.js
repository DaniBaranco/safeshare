/**
 * Configuración de la aplicación.
 * Valores de producto (no criptográficos): reglas de PIN, textos de
 * compartición, tiempos de UI. Los parámetros de cifrado viven en
 * core/crypto.js porque forman parte del formato del enlace.
 */
export const CONFIG = Object.freeze({
  APP_NAME: 'SafeShare',

  PIN: Object.freeze({
    MIN_LENGTH: 4,
    MAX_LENGTH: 10,
    GENERATED_LENGTH: 6,
    PATTERN: /^\d{4,10}$/,
  }),

  SHARE: Object.freeze({
    /** Texto que acompaña al enlace cuando se envía por WhatsApp u otra app. */
    message: (url) =>
      `Te he compartido un dato protegido con SafeShare 🔒\n${url}\n\n(El PIN te lo paso por otro canal)`,
  }),

  UI: Object.freeze({
    TOAST_MS: 2400,
    SERVICE_WORKER_PATH: 'sw.js',
  }),
});
