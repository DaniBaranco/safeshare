import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analyze } from '../js/core/detector.js';

test('texto vacío o inocuo no genera avisos', () => {
  assert.deepEqual(analyze(''), []);
  assert.deepEqual(analyze('Mi teléfono es 612 345 678'), []);
});

test('un número largo genera un warning', () => {
  const [w] = analyze('ES91 2100 0418 4502 0005 1332');
  assert.equal(w.level, 'warning');
  assert.equal(w.id, 'long-number');
});

test('tarjeta + CVV genera un danger y no duplica el warning', () => {
  const result = analyze('4111 1111 1111 1111 cvv 123');
  assert.equal(result.length, 1);
  assert.equal(result[0].level, 'danger');
  assert.equal(result[0].id, 'card-with-cvv');
});

test('"código de seguridad" también cuenta como CVV', () => {
  const [w] = analyze('Tarjeta 4111111111111111, código de seguridad 321');
  assert.equal(w.level, 'danger');
});
