Simpl.DB ![NPM Version](https://img.shields.io/npm/v/simpl.db.svg?color=3884FF&label=npm&url=https://npmjs.com/package/simpl.db)
===

<a href="https://www.buymeacoffee.com/5antos" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/default-blue.png" alt="Buy Me A Coffee" height="41" width="174"></a>

A lightweight, easy-to-use local database using JSON to store data.

- **[Documentation](https://simpldb.gitbook.io/docs/)**
- **[NPM Package](https://npmjs.com/package/simpl.db)**

Installation
------------

```
npm install simpl.db
```

Example Usage
-------------

```js
const SimplDB = require('simpl.db');

// The path for the JSON file must start from the root of the project
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

Contributing
------------

Before [creating an issue](https://github.com/5antos/simpl.db/issues), please ensure that it hasn't already been reported or suggested.

When [submitting a new pull request](https://github.com/5antos/simpl.db/pulls), please make sure the code style/format used is the same as the original code.

License
-------

Refer to the [LICENSE](LICENSE) file.