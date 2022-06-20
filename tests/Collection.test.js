/* eslint-disable no-undef */

const Database = require('../lib/Database');
const db = new Database({
  autoSave: false,
  collectionTimestamps: true,
  dataFile: 'tests/temp/database.json',
  collectionsFolder: 'tests/temp/collections'
});
const posts = db.createCollection('posts', {
  $id: 0,
  content: 'Wow, such empty content'
});


const now = Date.now();
jest
  .mock('fs', () => {
    const originalModule = jest.requireActual('fs');

    return {
      ...originalModule,
      readFileSync: jest.fn(() => '[]'),
      writeFileSync: jest.fn(() => undefined)
    };
  })
  .spyOn(Date, 'now').mockImplementation(() => now);


  
test('Collection#create', () => {
  expect(posts.create({ content: 'This is my first post!' }))
    .toEqual({
      id: 0,
      content: 'This is my first post!',
      createdAt: now,
      updatedAt: now,
    });
  expect(posts.create({ content: 'This is my second post!' }))
    .toEqual({
      id: 1,
      content: 'This is my second post!',
      createdAt: now,
      updatedAt: now,
    });

  expect(() => posts.create(null)).toThrow(/entry must be an object/);

  posts.remove();
});


test('Collection#createBulk', () => {
  const newPosts = [
    { content: 'This is my first post!' },
    { content: 'This is my second post!' }
  ];

  expect(posts.createBulk(newPosts))
    .toEqual([
      { id: 0, content: 'This is my first post!', createdAt: now, updatedAt: now, },
      { id: 1, content: 'This is my second post!', createdAt: now, updatedAt: now }
    ]);

  expect(() => posts.createBulk(null)).toThrow(/parameter must be an array/);

  posts.remove();
});


test('Collection#fetch', () => {}); // Cannot be tested


test('Collection#fetchOrCreate', () => {}); // Cannot be tested


test('Collection#get', () => {
  posts.create({ content: 'This is my first post!' });

  expect(posts.get())
    .toEqual([
      { id: 0, content: 'This is my first post!', createdAt: now, updatedAt: now }
    ]);
  expect(posts.get(p => p.id === 0)).toEqual({ id: 0, content: 'This is my first post!', createdAt: now, updatedAt: now });
  expect(posts.get(p => p.id === 1)).toBe(null);

  expect(() => posts.get(null)).toThrow(/parameter must be a function/);

  posts.remove();
});


test('Collection#getOrCreate', () => {
  const newPosts = [
    { content: 'This is my first post!' },
    { content: 'This is my second post!' }
  ];

  posts.create(newPosts[0]);

  expect(posts.getOrCreate(p => p.id === 0, newPosts[0])).toEqual({ id: 0, content: 'This is my first post!', createdAt: now, updatedAt: now });
  expect(posts.getOrCreate(p => p.id === 1, newPosts[1])).toEqual({ id: 1, content: 'This is my second post!', createdAt: now, updatedAt: now });

  expect(() => posts.getOrCreate(null)).toThrow(/parameter must be a function/);
  expect(() => posts.getOrCreate(p => p.id === 99, null)).toThrow(/entry must be an object/);

  posts.remove();
});


test('Collection#has', () => {
  posts.create({ content: 'This is my first post!' });

  expect(posts.has(p => p.id === 0)).toBe(true);
  expect(posts.has(p => p.id === 1)).toBe(false);
  
  expect(() => posts.has()).toThrow(/parameter must be a function/);
  expect(() => posts.has(null)).toThrow(/parameter must be a function/);

  posts.remove();
});


test('Collection#random', () => {
  expect(() => posts.random()).toThrow(/entries exceeds the total amount of entries/);

  posts.createBulk([
    { content: 'This is my first post!' },
    { content: 'This is my second post!' },
    { content: 'This is my third post!' },
    { content: 'This is my fourth post!' }
  ]);

  expect(posts.random()).toBeInstanceOf(Object);
  expect(posts.random(1)).toBeInstanceOf(Object);
  expect(posts.random(2)).toBeInstanceOf(Array);

  expect(() => posts.random(null)).toThrow(/entries must be a number bigger than 0/);
  expect(() => posts.random(-5)).toThrow(/entries must be a number bigger than 0/);
  expect(() => posts.random(99)).toThrow(/entries exceeds the total amount of entries/);

  posts.remove();
});


test('Collection#remove', () => {
  posts.createBulk([
    { content: 'This is my first post!' },
    { content: 'This is my second post!' },
    { content: 'This is my third post!' },
    { content: 'This is my fourth post!' }
  ]);

  expect(posts.entries).toBe(4);

  posts.remove();

  expect(posts.entries).toBe(0);
});


test('Collection#reset', () => {
  posts.createBulk([
    { content: 'This is my first post!' },
    { content: 'This is my second post!' },
    { content: 'This is my third post!' },
    { content: 'This is my fourth post!' }
  ]);

  expect(posts.reset(p => p.id === 0))
    .toEqual([
      { id: 0, content: 'Wow, such empty content', createdAt: now, updatedAt: now }
    ]);
  expect(posts.reset())
    .toEqual([
      { id: 0, content: 'Wow, such empty content', createdAt: now, updatedAt: now },
      { id: 1, content: 'Wow, such empty content', createdAt: now, updatedAt: now },
      { id: 2, content: 'Wow, such empty content', createdAt: now, updatedAt: now },
      { id: 3, content: 'Wow, such empty content', createdAt: now, updatedAt: now }
    ]);

  expect(() => posts.reset(null)).toThrow(/parameter must be a function/);

  posts.remove();
});


test('Collection#save', () => {}); // Cannot be tested


test('Collection#update', () => {
  posts.createBulk([
    { content: 'This is my first post!' },
    { content: 'This is my second post!' },
    { content: 'This is my third post!' }
  ]);

  expect(posts.update(p => p.content += ' ✨', target => target.id === 0))
    .toEqual([
      { id: 0, content: 'This is my first post! ✨', createdAt: now, updatedAt: now }
    ]);
  expect(posts.update(p => p.content = 'Hey 👋🏼! ' + p.content))
    .toEqual([
      { id: 0, content: 'Hey 👋🏼! This is my first post! ✨', createdAt: now, updatedAt: now },
      { id: 1, content: 'Hey 👋🏼! This is my second post!', createdAt: now, updatedAt: now },
      { id: 2, content: 'Hey 👋🏼! This is my third post!', createdAt: now, updatedAt: now }
    ]);

  expect(() => posts.update(null)).toThrow(/parameter must be a function/);
  expect(() => posts.update(p => p.content += '🙂', null)).toThrow(/parameter must be a function/);

  posts.remove();
});
