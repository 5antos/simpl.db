<div align="center">
  <h1>Simpl.DB</h1>
  <p>
    <a href="https://www.npmjs.com/package/simpl.db"><img src="https://img.shields.io/npm/v/simpl.db.svg?color=3884FF&label=version" alt="Version" /></a>
    <a href="https://www.npmjs.com/package/simpl.db"><img src="https://img.shields.io/npm/dt/simpl.db.svg?color=3884FF" alt="Downloads" /></a>
    <a href="https://www.npmjs.com/package/simpl.db"><img src="https://img.shields.io/badge/dependencies-0-brightgreen?color=3884FF" alt="Dependencies" /></a>
    <a href="https://packagequality.com/#?package=simpl.db"><img src="https://packagequality.com/shield/simpl.db.svg?color=3dd164" alt="Quality" /></a>
  </p>
  <br><br>
</div>

A lightweight, 0 dependency, easy-to-use local database using JSON to store data.

- **[Documentation](https://simpldb.gitbook.io/docs/)**
- **[Yarn Package](https://yarnpkg.com/package/simpl.db)**
- **[NPM Package](https://npmjs.com/package/simpl.db)**
- **[NPM Package Statistics](https://npm-stat.com/charts.html?package=simpl.db&from=2021-05-07)**

Installation
------------

```sh-session
npm install simpl.db
yarn add simpl.db
pnpm add simpl.db
```

Example Usage
-------------

<h3>Database</h3>

```js
const SimplDB = require('simpl.db');
const db = new SimplDB();


db.set('money', 100);
db.set('person.name', 'Peter');


db.has('money'); // true
db.has('person.name'); // true
db.has('person.age'); // false


db.get('person.name'); // 'Peter'
db.get('person.job'); // undefined


db.toJSON(); // { money: 100, person: { name: 'Peter' } }
```

<h3>Collections</h3>

```js
const SimplDB = require('simpl.db');
const db = new SimplDB();

const Users = db.createCollection('users');


Users.create({ name: 'Peter', age: 19 });
Users.create({ name: 'John', age: 19 });


Users.update(
  user => user.age = 20,
  target => target.name === 'Peter'
);
// or (simpl.db@2.11.0+)
const user = Users.get(target => target.name === 'Peter');
user.age = 20;
user.save();


Users.get(user => user.name === 'Peter'); // { name: 'Peter', age: 20 }
Users.getMany(user => user.age > 18); // [{ name: 'Peter', age: 20 }, { name: 'John', age: 19 }]
```

<p>With TypeScript:</p>

```ts
import { Database, Modifiable } from 'simpl.db';
const db = new Database();

type User = {
  name: string
  age: number
}

const Users = db.createCollection<User>('users');


Users.create({ name: 'Peter', age: 19 });
Users.create({ name: 'John', age: 19 });


Users.update(
  user => user.age = 20,
  target => target.name === 'Peter'
);
// or (simpl.db@2.11.0+)
const user = <Modifiable<User>> Users.get(target => target.name === 'Peter');
user.age = 20;
user.save();


Users.get(user => user.name === 'Peter'); // { name: 'Peter', age: 20 }
Users.getMany(user => user.age > 18); // [{ name: 'Peter', age: 20 }, { name: 'John', age: 19 }]
```

Contributing
------------

Before [creating an issue](https://github.com/5antos/simpl.db/issues), please ensure that it hasn't already been reported or suggested.

When [submitting a new pull request](https://github.com/5antos/simpl.db/pulls), please make sure the code style/format used is the same as the one used in the original code.

License
-------

Refer to the [LICENSE](LICENSE) file.
