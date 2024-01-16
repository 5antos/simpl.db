const Database = require('../lib/Database');

import { Database as DB } from "..";

const db: DB = new Database({
  autoSave: false,
  encryptionKey: 'n2dE3cU2UjVfhHGhmTaatrzcpVF6JLbu',
  dataFile: 'tests/temp/database.json',
  collectionsFolder: 'tests/temp/collections'
});


jest.mock('fs', () => {
  const originalModule = jest.requireActual('fs');

  return {
    ...originalModule,
    readFileSync: jest.fn(() => '{}'),
    writeFileSync: jest.fn(() => undefined)
  };
});



test('Database#createCollection', () => {
  type User = {
    name: string;
    money: number;
  }


  const collections = db.collections.length;
  const collection = db.createCollection<User>('users', {
    name: 'Anonymous',
    // $money: 500 // Currently not supported
  });

  expect(collection.totalEntries).toBe(0);
  expect(collections).toBe(db.collections.length - 1);

  expect(() => db.createCollection('users')).toThrow('A collection with the provided name already exists');

  // db.collections = [];
});