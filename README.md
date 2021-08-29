<div align="center">
  <h1>Simpl.DB</h1>
  <p>
    <a href="https://www.npmjs.com/package/simpl.db"><img src="https://img.shields.io/npm/v/simpl.db.svg?color=3884FF&label=npm" alt="NPM version" /></a>
    <a href="https://www.npmjs.com/package/simpl.db"><img src="https://img.shields.io/npm/dt/simpl.db.svg?color=3884FF" alt="NPM downloads" /></a>
    <a href="https://www.npmjs.com/package/simpl.db"><img src="https://img.shields.io/badge/dependencies-0-brightgreen?color=3884FF" alt="Dependencies" /></a>
  </p>
  <p>
    <a href="https://www.buymeacoffee.com/5antos" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/default-blue.png" alt="Buy Me A Coffee" height="41" width="174"></a>
  </p>
  <br><br>
</div>

A lightweight, 0 dependency, easy-to-use local database using JSON to store data.

- **[Documentation](https://simpldb.gitbook.io/docs/)**
- **[NPM Package](https://npmjs.com/package/simpl.db)**
- **[NPM Package Statistics](https://npm-stat.com/charts.html?package=simpl.db&from=2021-05-07)**

Installation
------------

```
npm install simpl.db
```

Example Usage
-------------

##Database
```js
const { Database } = require('simpl.db');
const db = new Database();

db.set('money', 100);
db.set('person.name', 'Peter');

db.has('money'); // true
db.has('person.name'); // true
db.has('person.age'); // false

db.get('person.name'); // 'Peter'
db.get('person.job'); // undefined

db.toJSON(); // { money: 100, person: { name: 'Peter' } }
```

##Collections
```js
const { Database } = require('simpl.db');
const db = new Database();

const Users = db.createCollection('users');

Users.create({ name: 'Peter', age: 19 });
Users.create({ name: 'John', age: 19 });

Users.get(user => user.name === 'Peter'); // { name: 'Peter', age: 19 }
Users.get(user => user.age > 18); // [{ name: 'Peter', age: 19 }, { name: 'John', age: 19 }]
```

Contributing
------------

Before [creating an issue](https://github.com/5antos/simpl.db/issues), please ensure that it hasn't already been reported or suggested.

When [submitting a new pull request](https://github.com/5antos/simpl.db/pulls), please make sure the code style/format used is the same as the one used in the original code.

License
-------

Refer to the [LICENSE](LICENSE) file.