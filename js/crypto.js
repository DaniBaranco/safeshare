/**
 * SafeShare — motor de cifrado 100% local (Web Crypto API).
 *
 * Nada de lo que se cifra aquí sale nunca de este dispositivo hacia un
 * servidor: todo el resultado (clave + datos cifrados) se codifica dentro
 * del fragmento "#" de la URL, que los navegadores NUNCA envían al servidor
 * al cargar una página. SafeShare es una web estática (sin backend): el
 * propio enlace ES el contenedor del secreto cifrado.
 *
 * Esquema:
 *  - PBKDF2 (SHA-256, 150.000 iteraciones) deriva una clave AES a partir del
 *    PIN/contraseña que el usuario define.
 *  - AES-256-GCM cifra el texto con esa clave derivada (autentica + cifra).
 *  - El payload final (salt + iv + ciphertext) se concatena y se codifica en
 *    base64url para que quepa en una URL sin caracteres problemáticos.
 */

const SafeCrypto = (() => {
  const PBKDF2_ITERATIONS = 150000;
  const SALT_BYTES = 16;
  const IV_BYTES = 12;

  function bytesToBase64url(bytes) {
    let binary = '';
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  function base64urlToBytes(str) {
    const padded = str.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (str.length % 4)) % 4);
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }

  async function deriveKey(pin, salt) {
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw', enc.encode(pin), { name: 'PBKDF2' }, false, ['deriveKey']
    );
    return crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Cifra un texto con un PIN. Devuelve un string base64url listo para ir
   * en la URL (fragmento #d=...).
   */
  async function encrypt(plainText, pin) {
    const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
    const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
    const key = await deriveKey(pin, salt);
    const enc = new TextEncoder();
    const cipherBuffer = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv }, key, enc.encode(plainText)
    );
    const cipherBytes = new Uint8Array(cipherBuffer);

    const payload = new Uint8Array(salt.length + iv.length + cipherBytes.length);
    payload.set(salt, 0);
    payload.set(iv, salt.length);
    payload.set(cipherBytes, salt.length + iv.length);

    return bytesToBase64url(payload);
  }

  /**
   * Descifra el payload base64url con el PIN dado.
   * Lanza un error si el PIN es incorrecto o el payload está corrupto.
   */
  async function decrypt(payloadB64url, pin) {
    const payload = base64urlToBytes(payloadB64url);
    const salt = payload.slice(0, SALT_BYTES);
    const iv = payload.slice(SALT_BYTES, SALT_BYTES + IV_BYTES);
    const cipherBytes = payload.slice(SALT_BYTES + IV_BYTES);

    const key = await deriveKey(pin, salt);
    const plainBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv }, key, cipherBytes
    );
    return new TextDecoder().decode(plainBuffer);
  }

  /** Genera un PIN numérico aleatorio de 6 dígitos, fácil de dictar por teléfono. */
  function generatePin() {
    const n = crypto.getRandomValues(new Uint32Array(1))[0] % 1000000;
    return String(n).padStart(6, '0');
  }

  return { encrypt, decrypt, generatePin };
})();
