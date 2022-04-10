/* eslint-disable no-undef */

const { isObject, isValidKey } = require('../lib/Utils');



test('isObject function', () => {
  expect(isObject('aaa')).toBe(false);
  expect(isObject({})).toBe(true);
  expect(isObject('{}')).toBe(false);
  expect(isObject([])).toBe(false);
});


test('isValidKey function', () => {
  expect(isValidKey('aaa')).toBe(true);
  expect(isValidKey('\u200b')).toBe(true);
  expect(isValidKey('\n')).toBe(true);
  expect(isValidKey(' ')).toBe(true);
  expect(isValidKey('🤔')).toBe(true);
  expect(isValidKey('nested.key')).toBe(true);
  expect(isValidKey('nested..key')).toBe(false);
  expect(isValidKey({})).toBe(false);
  expect(isValidKey([])).toBe(false);
});
