/**
 * SafeShare — motor de cifrado 100% local (Web Crypto API).
 *
 * Módulo puro: no toca el DOM ni `location`, por lo que es testeable en
 * Node y reutilizable. Nada de lo que se cifra aquí sale del dispositivo:
 * el resultado se codifica en el fragmento "#" de la URL, que los
 * navegadores nunca envían al servidor.
 *
 * Esquema (v1):
 *  - PBKDF2 (SHA-256, 150.000 iteraciones) deriva una clave AES-256 a
 *    partir del PIN.
 *  - AES-256-GCM cifra y autentica el texto.
 *  - payload = salt (16 B) + iv (12 B) + ciphertext, codificado en base64url.
 *
 * Los parámetros están aquí y no en config.js porque cambiarlos rompe la
 * compatibilidad con enlaces ya generados. Si algún día se cambian, hay
 * que introducir un prefijo de versión en el payload.
 */

export const CRYPTO_PARAMS = Object.freeze({
  PBKDF2_ITERATIONS: 150000,
  SALT_BYTES: 16,
  IV_BYTES: 12,
  KEY_BITS: 256,
});

const subtle = globalThis.crypto.subtle;

export function bytesToBase64url(bytes) {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function base64urlToBytes(str) {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (str.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function deriveKey(pin, salt) {
  const keyMaterial = await subtle.importKey(
    'raw', new TextEncoder().encode(pin), { name: 'PBKDF2' }, false, ['deriveKey'],
  );
  return subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: CRYPTO_PARAMS.PBKDF2_ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: CRYPTO_PARAMS.KEY_BITS },
    false,
    ['encrypt', 'decrypt'],
  );
}

/**
 * Cifra un texto con un PIN.
 * @returns {Promise<string>} payload base64url listo para ir en la URL.
 */
export async function encrypt(plainText, pin) {
  const { SALT_BYTES, IV_BYTES } = CRYPTO_PARAMS;
  const salt = globalThis.crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const key = await deriveKey(pin, salt);
  const cipherBuffer = await subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(plainText));
  const cipherBytes = new Uint8Array(cipherBuffer);

  const payload = new Uint8Array(SALT_BYTES + IV_BYTES + cipherBytes.length);
  payload.set(salt, 0);
  payload.set(iv, SALT_BYTES);
  payload.set(cipherBytes, SALT_BYTES + IV_BYTES);
  return bytesToBase64url(payload);
}

/**
 * Descifra un payload base64url con el PIN dado.
 * Lanza si el PIN es incorrecto o el payload está corrupto.
 */
export async function decrypt(payloadB64url, pin) {
  const { SALT_BYTES, IV_BYTES } = CRYPTO_PARAMS;
  const payload = base64urlToBytes(payloadB64url);
  if (payload.length <= SALT_BYTES + IV_BYTES) throw new Error('Payload demasiado corto');

  const salt = payload.slice(0, SALT_BYTES);
  const iv = payload.slice(SALT_BYTES, SALT_BYTES + IV_BYTES);
  const cipherBytes = payload.slice(SALT_BYTES + IV_BYTES);

  const key = await deriveKey(pin, salt);
  const plainBuffer = await subtle.decrypt({ name: 'AES-GCM', iv }, key, cipherBytes);
  return new TextDecoder().decode(plainBuffer);
}

/** Genera un PIN numérico aleatorio, fácil de dictar por teléfono. */
export function generatePin(length = 6) {
  const digits = globalThis.crypto.getRandomValues(new Uint8Array(length));
  return Array.from(digits, (d) => String(d % 10)).join('');
}
