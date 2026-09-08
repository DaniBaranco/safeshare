import { test } from 'node:test';
import assert from 'node:assert/strict';
import { encrypt, decrypt, generatePin, bytesToBase64url, base64urlToBytes, CRYPTO_PARAMS } from '../js/core/crypto.js';

test('cifra y descifra un texto con el mismo PIN', async () => {
  const payload = await encrypt('ES91 2100 0418 4502 0005 1332', '123456');
  assert.match(payload, /^[A-Za-z0-9_-]+$/, 'el payload debe ser base64url');
  assert.equal(await decrypt(payload, '123456'), 'ES91 2100 0418 4502 0005 1332');
});

test('conserva caracteres no ASCII', async () => {
  const text = 'Contraseña: ñandú 🔒 · 東京';
  assert.equal(await decrypt(await encrypt(text, '4321'), '4321'), text);
});

test('un PIN incorrecto falla', async () => {
  const payload = await encrypt('secreto', '111111');
  await assert.rejects(decrypt(payload, '222222'));
});

test('un payload corrupto o demasiado corto falla', async () => {
  await assert.rejects(decrypt('AAAA', '1234'));
  const payload = await encrypt('secreto', '1234');
  const tampered = payload.slice(0, -2) + (payload.endsWith('A') ? 'BB' : 'AA');
  await assert.rejects(decrypt(tampered, '1234'));
});

test('cada cifrado usa salt e IV distintos y el tamaño es el esperado', async () => {
  const a = await encrypt('x', '0000');
  const b = await encrypt('x', '0000');
  assert.notEqual(a, b);
  const { SALT_BYTES, IV_BYTES } = CRYPTO_PARAMS;
  assert.equal(base64urlToBytes(a).length, SALT_BYTES + IV_BYTES + 1 + 16, 'salt + iv + 1 byte + tag GCM');
});

test('base64url es reversible', () => {
  const bytes = new Uint8Array([0, 1, 2, 250, 251, 252, 253, 254, 255]);
  assert.deepEqual(base64urlToBytes(bytesToBase64url(bytes)), bytes);
});

test('generatePin devuelve solo dígitos con la longitud pedida', () => {
  for (let i = 0; i < 50; i++) assert.match(generatePin(), /^\d{6}$/);
  assert.match(generatePin(4), /^\d{4}$/);
});
