/* eslint-disable no-undef */
const Database = require('../lib/Database');
const db = new Database({ autoSave: false });


jest.mock('fs', () => {
  const originalModule = jest.requireActual('fs');

  return {
    ...originalModule,
    readFileSync: jest.fn(() => '{}'),
    writeFileSync: jest.fn(() => undefined)
  };
});

test('if has function is working', () => {

  expect(db.has('dessert')).toBe(false);

  db.set('dessert', 'cake');

  expect(db.has('dessert')).toBe(true);
  expect(() => db.has([])).toThrow(/key is invalid/);

});

test('if set function is working', () => {

  expect(db.set('key', 'value')).toBe('value');
  expect(() => db.set({}, 'object')).toThrow(/key is invalid/);
  expect(() => db.set('key.', 'value')).toThrow();
  expect(() => db.set('aa', 'bb', {})).toThrow('Parameter encrypt must be of type boolean');

});

test('if get function is working', () => {

  expect(db.get('system')).toBe(undefined);
  db.set('system', 'Zorin OS');

  expect(db.get('system')).toBe('Zorin OS');
  db.set('arrNumber', [ 1, 2, 3 ]);

  expect(db.get('arrNumber')).toEqual([1, 2, 3]);
  expect(() => db.set('key', 'value', true)).toThrow('Missing Encryption Key');

  // TODO
  // Test encryption

});

test('if add function is working', () => {
  
  db.set('items', 10);
  expect(db.add('items', -20)).toBe(-10);
  expect(() => db.add('items', Infinity)).toThrow('A valid value must be provided');
  expect(() => db.add('items', NaN)).toThrow();
  expect(() => db.add('items', undefined)).toThrow();

});

test('if subtract function is working', () => {

  db.set('items', 0);
  expect(db.subtract('items', 20)).toBe(-20);
  expect(db.subtract('items', 0)).toBe(-20);
  expect(() => db.subtract('items', Infinity)).toThrow();

});
