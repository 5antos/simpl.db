/* eslint-disable no-undef */

const Database = require('../lib/Database');
const Collection = require('../lib/Collection');

const db = new Database({
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



test('Database#add', () => {
  db.set('balance', 350);
  db.set('account', { owner: '5antos', balance: 800 });

  expect(db.add('balance', 500)).toBe(850);
  expect(db.add('account.balance', 200)).toEqual({ owner: '5antos', balance: 1000 });

  expect(() => db.add('balance', Infinity)).toThrow('A valid value must be provided');
  expect(() => db.add('balance', NaN)).toThrow('A valid value must be provided');
  expect(() => db.add('account..balance', 200)).toThrow(/key is invalid/);

  db.clear();
});


test('Database#clear', () => {
  db.set('people', { users: [{ name: 'Peter' }, { name: 'Michael' }] });
  db.clear();

  expect(db.get('people')).toBe(undefined);
  expect(db.toJSON()).toEqual({});
});


test('Database#createCollection', () => {
  const collections = db.collections.length;
  const collection = db.createCollection('users');

  expect(collection.totalEntries).toBe(0);
  expect(collections).toBe(db.collections.length - 1);

  expect(() => db.createCollection('users')).toThrow('A collection with the provided name already exists');
  expect(() => db.createCollection(null)).toThrow(/name is invalid/);

  db.collections = [];
});


test('Database#delete', () => {
  db.set('food', ['pizza', 'burger', 'fries']);

  expect(db.delete('food')).toBe(true);
  expect(db.delete('drinks')).toBe(false);
  expect(db.get('food')).toBe(undefined);

  expect(() => db.delete('some..key')).toThrow(/key is invalid/);

  db.clear();
});


test('Database#deleteCollection', () => {
  db.createCollection('users');

  expect(db.deleteCollection('posts')).toBe(false);
  expect(db.collections.length).toBe(1);

  expect(db.deleteCollection('users')).toBe(true);
  expect(db.collections.length).toBe(0);

  expect(() => db.deleteCollection(null)).toThrow(/name is invalid/);

  db.collections = [];
});


test('Database#extend', () => {
  /*
    Note:
      When using the extend method, you can access the target collection's methods with the "this" keyword,
      but only if you use the function keyword (i.e. arrow functions won't work).
  */

  const extendedDb = db.extend({
    // Add new methods
    chunk(key, count) {
      const array = this.get(key);

      const newArr = [];

      for (var i = 0; i < array.length; i+=count)
        newArr[i/count] = array.slice(i, i+count);
      
      return newArr;
    },

    // Overwrite existing methods
    delete() {
      return 'This is actually not deleting anything. It\'s just for the sake of testing. 🫠';
    }
  });

  extendedDb.set('someArray', [1,2,3,4,5]);

  expect(extendedDb.chunk('someArray', 2)).toEqual([[1,2], [3,4], [5]]);
  expect(extendedDb.delete('someKey')).not.toBe(db.delete('SomeKey'));

  extendedDb.clear();
  db.clear();
});


test('Database#fetch', () => {}); // Cannot be tested


test('Database#get', () => {
  db.set('Greeting', 'Hello World');
  db.set('user', { name: 'Peter', age: 19 });
  db.set('PASSWORD', 'password123', true);

  expect(db.get('Greeting')).toBe('Hello World');
  expect(db.get('user.name')).toBe('Peter');
  expect(db.get('PASSWORD')).not.toBe('password123');
  expect(db.get('PASSWORD', true)).toBe('password123');

  expect(() => db.get('some..key')).toThrow(/key is invalid/);
  expect(() => db.get('user.name', null)).toThrow(/decrypt must be of type boolean/);

  db.clear();
});


test('Database#getCollection', () => {
  db.createCollection('people');

  expect(db.getCollection('people')).toBeInstanceOf(Collection);
  expect(db.getCollection('users')).toBe(null);

  expect(() => db.getCollection(null)).toThrow(/name is invalid/);

  db.collections = [];
});


test('Database#has', () => {
  db.set('prefix', '!');
  db.set('profile', { username: '5antos' });

  expect(db.has('prefix')).toBe(true);
  expect(db.has('profile.username')).toBe(true);
  expect(db.has('profile.password')).toBe(false);

  expect(() => db.has('some..key')).toThrow(/key is invalid/);

  db.clear();
});


test('Database#pull', () => {
  db.set('numbers', [1, 2, 3, 2, 4, 3, 1, 1]);
  db.set('people', [{ name: 'Peter' }, { name: 'Michael' }]);
  db.set('user', { id: 32171, items: ['sword', 'axe'] });
  db.set('key', 'value');

  expect(db.pull('numbers', 1)).toEqual([2, 3, 2, 4, 3]);
  expect(db.pull('people', { name: 'Peter' })).toEqual([{ name: 'Michael' }]);
  expect(db.pull('user.items', 'bow')).toEqual({ id: 32171, items: ['sword', 'axe'] });
  expect(db.pull('user.items', 'sword')).toEqual({ id: 32171, items: ['axe'] });

  expect(() => db.pull('some..key', 'value')).toThrow(/key is invalid/);
  expect(() => db.pull('numbers', undefined)).toThrow(/valid value must be provided/);
  expect(() => db.pull('key', 'value')).toThrow(/value of the provided key must be an array/);

  db.clear();
});


test('Database#push', () => {
  db.set('people', ['Peter', 'Henry']);
  db.set('user', { id: 32171, items: ['sword'] });
  db.set('key', 'value');

  expect(db.push('people', 'Catherine')).toEqual(['Peter', 'Henry', 'Catherine']);
  expect(db.push('user.items', 'axe')).toEqual({ id: 32171, items: ['sword', 'axe'] });
  expect(db.push('posts', { title: 'My first post' })).toEqual([{ title: 'My first post' }]);

  expect(() => db.push('some..key', 'value')).toThrow(/key is invalid/);
  expect(() => db.push('people', undefined)).toThrow(/valid value must be provided/);
  expect(() => db.push('key', 'value')).toThrow(/value of the provided key must be an array/);

  db.clear();
});


test('Database#rename', () => {
  db.set('people', ['Peter', 'Henry']);
  
  expect(db.rename('people', 'users')).toEqual({ users: ['Peter', 'Henry'] });

  db.clear();
  db.set('user', { id: 32171, items: ['sword'] });
  
  expect(db.rename('user.items', 'inventory')).toEqual({ id: 32171, inventory: ['sword'] });

  db.clear();
  db.set('posts', [{ title: 'My first post' }]);

  expect(db.rename('posts', 'forum.posts')).toEqual({ forum: { posts: [{ title: 'My first post' }] }});
  expect(db.rename('forum.posts', 'verifiedPosts')).toEqual({ verifiedPosts: [{ title: 'My first post' }] });
  
  expect(() => db.rename('some..key', 'value')).toThrow(/key is invalid/);
  expect(() => db.rename('validKey', 'invalid..key')).toThrow(/provided name is invalid/);
  expect(() => db.rename('people', undefined)).toThrow(/provided name is invalid/);
  expect(() => db.rename('someUnexistingKey', 'value')).toThrow(/key does not exist/);

  db.clear();
});


test('Database#save', () => {}); // Cannot be tested


test('Database#set', () => {
  expect(db.set('user', { name: 'Peter' })).toEqual({ name: 'Peter' });
  expect(db.set('user.age', 20)).toEqual({ name: 'Peter', age: 20 });
  expect(db.set('user.age', undefined)).toEqual({ name: 'Peter' });
  expect(db.set('PASSWORD', 'password123', true)).not.toBe('password123');

  expect(() => db.set('some..key', 'value')).toThrow(/key is invalid/);
  expect(() => db.set('user.hobbies', ['Programming'], null)).toThrow(/encrypt must be of type boolean/);

  db.clear();
});


test('Database#subtract', () => {
  db.set('balance', 350);
  db.set('account', { owner: '5antos', balance: 800 });

  expect(db.subtract('balance', 100)).toBe(250);
  expect(db.subtract('account.balance', 200)).toEqual({ owner: '5antos', balance: 600 });

  expect(() => db.subtract('balance', Infinity)).toThrow('A valid value must be provided');
  expect(() => db.subtract('balance', NaN)).toThrow('A valid value must be provided');
  expect(() => db.subtract('account..balance', 200)).toThrow(/key is invalid/);

  db.clear();
});


test('Database#toJSON', () => {
  expect(db.toJSON()).toEqual({});

  db.set('colors', ['red', 'green', 'blue']);

  expect(db.toJSON()).toEqual({ colors: ['red', 'green', 'blue'] });

  db.clear();
});


test('Database#update', () => {
  db.set('player', { name: '5antos', money: 500 });

  expect(db.update('player', d => d.money += 500)).toEqual({ name: '5antos', money: 1000 });
  expect(db.update('player', d => delete d.money)).toEqual({ name: '5antos' });

  expect(db.update('player.name', (name) => name.toUpperCase())).toEqual({ name: '5ANTOS' });
  // or
  expect(db.update('player.name', (name) => name = name.toLowerCase())).toEqual({ name: '5antos' });

  expect(db.update('player.name', function(d) { return d + ' 👨🏻‍💻'; })).toEqual({ name: '5antos 👨🏻‍💻' });

  expect(() => db.update('player', d => d.items.push(['sword', 'axe']))).toThrow(/callback function failed to update/);

  db.clear();
});
