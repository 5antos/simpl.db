/* eslint-disable no-undef */

const Database = require('../lib/Database');
const db = new Database({
  autoSave: false,
  collectionTimestamps: true,
  dataFile: 'tests/temp/database.json',
  collectionsFolder: 'tests/temp/collections'
});
const Posts = db.createCollection('posts', {
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
  expect(Posts.create({ content: 'This is my first post!' }))
    .toEqual({
      id: 0,
      content: 'This is my first post!',
      createdAt: now,
      updatedAt: now,
    });
  expect(Posts.create({ content: 'This is my second post!' }))
    .toEqual({
      id: 1,
      content: 'This is my second post!',
      createdAt: now,
      updatedAt: now,
    });

  expect(() => Posts.create(null)).toThrow(/entry must be an object/);

  Posts.remove();
});


test('Collection#createBulk', () => {
  const newPosts = [
    { content: 'This is my first post!' },
    { content: 'This is my second post!' }
  ];

  expect(Posts.createBulk(newPosts))
    .toEqual([
      { id: 0, content: 'This is my first post!', createdAt: now, updatedAt: now, },
      { id: 1, content: 'This is my second post!', createdAt: now, updatedAt: now }
    ]);

  expect(() => Posts.createBulk(null)).toThrow(/parameter must be an array/);

  Posts.remove();
});


test('Collection#fetch', () => {}); // Cannot be tested


test('Collection#fetchOrCreate', () => {}); // Cannot be tested


test('Collection#get', () => {
  Posts.create({ content: 'This is my first post!' });

  expect(Posts.get(p => p.id === 0)).toMatchObject({ id: 0, content: 'This is my first post!', createdAt: now, updatedAt: now });
  expect(Posts.get(p => p.id === 1)).toBe(null);

  expect(() => Posts.get(null)).toThrow(/parameter must be a function/);

  Posts.remove();
});


test('Collection#getMany', () => {
  Posts.create({ content: 'This is my first post!' });

  expect(Posts.getMany())
    .toMatchObject([
      { id: 0, content: 'This is my first post!', createdAt: now, updatedAt: now }
    ]);
  expect(Posts.getMany(p => p.id === 0))
    .toMatchObject([
      { id: 0, content: 'This is my first post!', createdAt: now, updatedAt: now }
    ]);
  expect(Posts.getMany(p => p.id === 1)).toEqual([]);

  expect(() => Posts.getMany(null)).toThrow(/parameter must be a function/);

  Posts.remove();
});


test('Collection#getMany', () => {
  Posts.create({ content: 'This is my first post!' });

  expect(Posts.getMany())
    .toMatchObject([
      { id: 0, content: 'This is my first post!', createdAt: now, updatedAt: now }
    ]);
  expect(Posts.getMany(p => p.id === 0))
    .toMatchObject([
      { id: 0, content: 'This is my first post!', createdAt: now, updatedAt: now }
    ]);
  expect(Posts.getMany(p => p.id === 1)).toEqual([]);

  expect(() => Posts.getMany(null)).toThrow(/parameter must be a function/);

  Posts.remove();
});


test('Collection#getOrCreate', () => {
  const newPosts = [
    { content: 'This is my first post!' },
    { content: 'This is my second post!' }
  ];

  Posts.create(newPosts[0]);

  expect(Posts.getOrCreate(p => p.id === 0, newPosts[0])).toMatchObject({ id: 0, content: 'This is my first post!', createdAt: now, updatedAt: now });
  expect(Posts.getOrCreate(p => p.id === 1, newPosts[1])).toMatchObject({ id: 1, content: 'This is my second post!', createdAt: now, updatedAt: now });

  expect(() => Posts.getOrCreate(null)).toThrow(/parameter must be a function/);
  expect(() => Posts.getOrCreate(p => p.id === 99, null)).toThrow(/entry must be an object/);

  Posts.remove();
});


test('Collection#has', () => {
  Posts.create({ content: 'This is my first post!' });

  expect(Posts.has(p => p.id === 0)).toBe(true);
  expect(Posts.has(p => p.id === 1)).toBe(false);
  
  expect(() => Posts.has()).toThrow(/parameter must be a function/);
  expect(() => Posts.has(null)).toThrow(/parameter must be a function/);

  Posts.remove();
});


test('Collection#random', () => {
  expect(() => Posts.random()).toThrow(/entries exceeds the total amount of entries/);

  Posts.createBulk([
    { content: 'This is my first post!' },
    { content: 'This is my second post!' },
    { content: 'This is my third post!' },
    { content: 'This is my fourth post!' }
  ]);

  expect(Posts.random()).toBeInstanceOf(Object);
  expect(Posts.random(1)).toBeInstanceOf(Object);
  expect(Posts.random(2)).toBeInstanceOf(Array);

  expect(() => Posts.random(null)).toThrow(/entries must be a number bigger than 0/);
  expect(() => Posts.random(-5)).toThrow(/entries must be a number bigger than 0/);
  expect(() => Posts.random(99)).toThrow(/entries exceeds the total amount of entries/);

  Posts.remove();
});


test('Collection#remove', () => {
  Posts.createBulk([
    { content: 'This is my first post!' },
    { content: 'This is my second post!' },
    { content: 'This is my third post!' },
    { content: 'This is my fourth post!' }
  ]);

  expect(Posts.entries).toBe(4);

  Posts.remove();

  expect(Posts.entries).toBe(0);
});


test('Collection#reset', () => {
  Posts.createBulk([
    { content: 'This is my first post!' },
    { content: 'This is my second post!' },
    { content: 'This is my third post!' },
    { content: 'This is my fourth post!' }
  ]);

  expect(Posts.reset(p => p.id === 0))
    .toEqual([
      { id: 0, content: 'Wow, such empty content', createdAt: now, updatedAt: now }
    ]);
  expect(Posts.reset())
    .toEqual([
      { id: 0, content: 'Wow, such empty content', createdAt: now, updatedAt: now },
      { id: 1, content: 'Wow, such empty content', createdAt: now, updatedAt: now },
      { id: 2, content: 'Wow, such empty content', createdAt: now, updatedAt: now },
      { id: 3, content: 'Wow, such empty content', createdAt: now, updatedAt: now }
    ]);

  expect(() => Posts.reset(null)).toThrow(/parameter must be a function/);

  Posts.remove();
});


test('Collection#save', () => {}); // Cannot be tested


test('Collection#update', () => {
  Posts.createBulk([
    { content: 'This is my first post!' },
    { content: 'This is my second post!' },
    { content: 'This is my third post!' }
  ]);

  expect(Posts.update(p => p.content += ' ✨', target => target.id === 0))
    .toEqual([
      { id: 0, content: 'This is my first post! ✨', createdAt: now, updatedAt: now }
    ]);
  expect(Posts.update(p => p.content = 'Hey 👋🏼! ' + p.content))
    .toEqual([
      { id: 0, content: 'Hey 👋🏼! This is my first post! ✨', createdAt: now, updatedAt: now },
      { id: 1, content: 'Hey 👋🏼! This is my second post!', createdAt: now, updatedAt: now },
      { id: 2, content: 'Hey 👋🏼! This is my third post!', createdAt: now, updatedAt: now }
    ]);

  expect(() => Posts.update(null)).toThrow(/parameter must be a function/);
  expect(() => Posts.update(p => p.content += '🙂', null)).toThrow(/parameter must be a function/);

  Posts.remove();
});




test('Data#save', () => {
  Posts.create({ content: 'This is my first post!' });

  const firstPost = Posts.get(p => p.id === 0);

  firstPost.content = 'Post removed';
  firstPost.save();

  expect(Posts.get(p => p.id === 0)).toMatchObject({ id: 0, content: 'Post removed', createdAt: now, updatedAt: now });

  Posts.remove();
});



test('Data#save', () => {
  Posts.create({ content: 'This is my first post!' });

  const firstPost = Posts.get(p => p.id === 0);

  firstPost.content = 'Post removed';
  firstPost.save();

  expect(Posts.get(p => p.id === 0)).toMatchObject({ id: 0, content: 'Post removed', createdAt: now, updatedAt: now });

  Posts.remove();
});