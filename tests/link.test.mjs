import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildShareUrl, extractPayload, currentBaseUrl } from '../js/core/link.js';

test('construye y vuelve a leer el enlace', () => {
  const url = buildShareUrl('abc-_XYZ09', 'https://example.com/safeshare/');
  assert.equal(url, 'https://example.com/safeshare/#d=abc-_XYZ09');
  assert.equal(extractPayload(new URL(url).hash), 'abc-_XYZ09');
});

test('acepta enlaces v1 existentes y fragmentos con más parámetros', () => {
  assert.equal(extractPayload('#d=Kx9T4'), 'Kx9T4');
  assert.equal(extractPayload('d=Kx9T4'), 'Kx9T4');
  assert.equal(extractPayload('#v=1&d=Kx9T4'), 'Kx9T4');
});

test('rechaza fragmentos vacíos o con caracteres inesperados', () => {
  assert.equal(extractPayload(''), null);
  assert.equal(extractPayload('#'), null);
  assert.equal(extractPayload('#como-funciona'), null);
  assert.equal(extractPayload('#d='), null);
  assert.equal(extractPayload('#d=<script>'), null);
});

test('currentBaseUrl ignora query y fragmento', () => {
  const loc = { origin: 'https://example.com', pathname: '/app/' };
  assert.equal(currentBaseUrl(loc), 'https://example.com/app/');
});
