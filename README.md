Simpl.DB [![NPM Version](https://img.shields.io/npm/v/simpl.db.svg?style=flat-round)]((https://npmjs.com/package/simpl.db))
===

A lightweight, easy-to-use local database using JSON to store data.

Installation
------------

Node.js 10.4+ is required.

```
npm install simpl.db
```

Example Usage
-------------

```js
const SimplDB = require('simpl.db');

// The path for the JSON file must start from the root of the project!
const db = new SimplDB({ filePath: './db.json' });

db.set('money', 100);
db.set('person.name', 'Peter');

db.has('money'); // true
db.has('person.name'); // true
db.has('person.age'); // false

db.get('person.name'); // 'Peter'
db.get('person.job'); // undefined

db.toJSON(); // { money: 100, person: { name: 'Peter' } }
```

More examples can be found in [the examples folder](https://github.com/5antos/simpl.db/tree/master/examples).

Contributing
------------

Before [creating an issue](https://github.com/5antos/simpl.db/issues), please ensure that it hasn't already been reported or suggested.

When [submitting a new pull request](https://github.com/5antos/simpl.db/pulls) please make sure the code style/format used is the same.

License
-------

Refer to the [LICENSE](LICENSE) file.