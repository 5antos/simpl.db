'use strict';

const FS = require('fs');
const path = require('path');
const crypto = require('crypto');
const Collection = require('./Collection');
const { isObject, isValidKey } = require('./Utils');

class Database {
  #config;
  #data;

  constructor(config) {
    this.collections = [];
    this.#config = Object.assign({
      dataFile: './database.json',
      collectionsFolder: './collections',
      collectionTimestamps: false,
      autoSave: true,
      encryptionKey: null,
      tabSize: 0
    }, config);

    this.version = require('../package.json').version;
    this.#data = {};

    this.#validatePath(this.#config?.dataFile);
    this.#validateEncryptionKey(this.#config.encryptionKey);
    this.#checkJSON();
    this.#data = this.#fetchData();
  }


  add(key, value) {
    return this.#addOrSubtract('add', key, value);
  }

  clear() {
    this.#data = {};
    if (this.#config.autoSave) this.save();
  }

  createCollection(name, defaultValues={}) {
    this.#validateFolderPath(this.#config?.collectionsFolder);

    if (!isValidKey(name)) throw new TypeError('The provided name is invalid');

    const newCollection = new Collection(name, { folderPath: this.#config.collectionsFolder, tabSize: this.#config.tabSize, autoSave: this.#config.autoSave, timestamps: this.#config.collectionTimestamps }, defaultValues);
    this.collections.push(newCollection);

    return newCollection;
  }

  delete(key) {
    if (!isValidKey(key)) throw new TypeError('The provided key is invalid');

    const data = this.get(key);

    key.split('.').reduce((o, curr, i, arr) => {
      if (i === arr.length-1) delete o?.[curr];
      else return o?.[curr];
    }, this.#data);

    if (this.#config.autoSave) this.save();

    return !!data && this.get(key) === undefined;
  }

  deleteCollection(name) {
    if (!isValidKey(name)) throw new TypeError('The provided name is invalid');

    const collectionIndex = this.collections.findIndex(c => c.name === name);

    if (collectionIndex === -1) return false;

    this.#deleteFile(path.relative(process.cwd(), this.#config.collectionsFolder + '/' + name + '.json'));

    return this.collections.splice(collectionIndex, 1).length > 0;
  }

  fetch(key) {
    if (!isValidKey(key)) throw new TypeError('The provided key is invalid');

    return key.split('.').reduce((acc, curr) => acc?.[curr], this.#fetchData());
  }

  get(key, decrypt=false) {
    if (!isValidKey(key)) throw new TypeError('The provided key is invalid');
    else if (typeof decrypt !== 'boolean') throw new TypeError('Parameter decrypt must be of type boolean');
    else if (decrypt && !this.#config.encryptionKey) throw new Error('Missing Encryption Key');

    const data = key.split('.').reduce((acc, curr) => acc?.[curr], this.#data);

    return !decrypt ? data : this.#decrypt(data);
  }

  has(key) {
    if (!isValidKey(key)) throw new TypeError('The provided key is invalid');

    return this.get(key) !== undefined;
  }

  pull(key, value) {
    if (!isValidKey(key)) throw new TypeError('The provided key is invalid');
    else if (value === undefined) throw new TypeError('A valid value must be provided');

    const oldArray = this.get(key) || [];

    if (!(Array.isArray(oldArray)) && oldArray !== undefined) throw new TypeError('The value of the provided key must be an array');

    this.set(key, oldArray.filter(v => v !== value));

    if (this.#config.autoSave) this.save();

    return this.get(key.split('.')[0]);
  }

  push(key, value) {
    if (!isValidKey(key)) throw new TypeError('The provided key is invalid');
    else if (value === undefined) throw new TypeError('A valid value must be provided');

    const oldArray = this.get(key) || [];

    if (!(Array.isArray(oldArray)) && oldArray !== undefined) throw new TypeError('The value of the provided key must be an array');

    oldArray.push(value);

    this.set(key, oldArray);

    if (this.#config.autoSave) this.save();

    return this.get(key.split('.')[0]);
  }

  save() {
    try {
      FS.writeFileSync(this.#config.dataFile, JSON.stringify(this.#data, null, this.#config.tabSize));
    } catch (e) {
      if (e.code === 'EACCES') throw new Error('The database file could not be accessed');
    }
  }

  set(key, value, encrypt=false) {
    if (!isValidKey(key)) throw new TypeError('The provided key is invalid');
    else if (typeof encrypt !== 'boolean') throw new TypeError('Parameter encrypt must be of type boolean');
    else if (encrypt && !this.#config.encryptionKey) throw new Error('Missing Encryption Key');

    const keys = key.split('.');

    if (this.get(key) !== value) {
      const objectDotNotation = (object, Ks) => {
        if (Ks.length === 1)
          object[Ks[0]] = !encrypt ? value : this.#encrypt(value);
        else {
          if (!isObject(object[Ks[0]])) object[Ks[0]] = {};
          
          object[Ks[0]] = { ...object[Ks[0]] };
          objectDotNotation(object[Ks[0]], Ks.slice(1));
        }
      };

      objectDotNotation(this.#data, keys);

      if (this.#config.autoSave) this.save();
    }

    return this.get(keys[0]);
  }

  subtract(key, value) {
    return this.#addOrSubtract('subtract', key, value);
  }

  toJSON() {
    return JSON.parse(JSON.stringify(this.#data));
  }



  /* ==================== Private Methods ==================== */

  #addOrSubtract(operation, key, value) {
    if (isNaN(value) || value === Infinity) throw new TypeError('A valid value must be provided');
    if (!isValidKey(key)) throw new TypeError('The provided key is invalid');

    const existingData = this.get(key) || 0;

    if (typeof value !== 'number') throw new TypeError('The provided value must be a number');
    else if (['undefined', 'number'].every(t => typeof existingData !== t)) throw new TypeError('The value of the provided key must be a number');

    this.set(key, operation === 'add' ? existingData + value : existingData - value);

    if (this.#config.autoSave) this.save();

    return this.get(key.split('.')[0]);
  }

  #checkJSON() {
    try {
      const fileContent = FS.readFileSync(this.#config.dataFile, 'utf8');

      if (!fileContent || !isObject(JSON.parse(fileContent))) {
        this.#data = {};
        this.save();
      }
    } catch(e) {
      if (e.code === 'ENOENT') FS.writeFileSync(this.#config.dataFile, '{}');
      else if (e.code === 'EACCES') throw new Error('The database file could not be accessed');
    }
  }

  // @vlucas, https://gist.github.com/vlucas/2bd40f62d20c1d49237a109d491974eb
  #decrypt(string) {
    try {
      this.#validateBeforeDecrypt(string);
      const stringParts = string.split(':');
      const iv = Buffer.from(stringParts.shift(), 'hex');
      const encryptedText = Buffer.from(stringParts.join(':'), 'hex');
      const decipher = crypto.createDecipheriv('aes-256-ctr', Buffer.from(this.#config.encryptionKey), iv);
      const decrypted = Buffer.concat([decipher.update(encryptedText), decipher.final()]);

      return decrypted.toString();
    } catch (e) {
      throw new Error('An error has occurred while decrypting a value');
    }
  }

  #deleteFile(path) {
    try {
      FS.unlinkSync(path);
    } catch(e) {
      throw new Error('An error has occurred while deleting the file ' + path + ': ' + e);
    }
  }

  // @vlucas, https://gist.github.com/vlucas/2bd40f62d20c1d49237a109d491974eb
  #encrypt(string) {
    try {
      this.#validateBeforeEncrypt(string);
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv('aes-256-ctr', Buffer.from(this.#config.encryptionKey), iv);
      const encrypted = Buffer.concat([cipher.update(string), cipher.final()]);

      return iv.toString('hex') + ':' + encrypted.toString('hex');
    } catch (e) {
      if (e.message === 'The provided value must be a string to be encrypted') throw e;
      else throw new Error('An error has occurred while encrypting a value');
    }
  }

  #fetchData() {
    try {
      return JSON.parse(FS.readFileSync(this.#config.dataFile, 'utf8'));
    } catch (e) {
      if (e.code === 'ENOENT') {
        FS.writeFileSync(this.#config.dataFile, '{}');
        return {};
      }
      else if (e.code === 'EACCES') throw new Error('The database file could not be accessed');
    }
  }

  #validateBeforeDecrypt(value) {
    if (typeof value !== 'string') throw new TypeError('The provided value must be a string to be decrypted');
    else if (value.split(':').length !== 2 || value.includes(' ')) throw new TypeError('The provided value could not be decrypted as it was not encrypted before');
  }

  #validateBeforeEncrypt(value) {
    if (typeof value !== 'string') throw new TypeError('The provided value must be a string to be encrypted');
  }

  #validateEncryptionKey(key) {
    if (this.#config.encryptionKey !== null) {
      if (typeof key !== 'string') throw new TypeError('The Encryption Key must be a string');
      else if (key.length !== 32) throw new Error('The Encryption Key must have a length of 32 characters');
    }
  }

  #validateFolderPath(folderPath) {
    try {
      if (!FS.statSync(folderPath).isDirectory()) throw new Error('Invalid path for collection. Provided path must lead to a folder');
    } catch (e) {
      if (e.code === 'ENOENT') FS.mkdirSync(this.#config.collectionsFolder);
      else if (e.code === 'EACCES') throw new Error('The provided folder could not be accessed');
      else throw new Error(e);
    }
  }

  #validatePath(dataFile) {
    if (path.extname(dataFile) !== '.json') throw new Error('Invalid file path for database. Provided path must lead to a .json file');

    try {
      FS.lstatSync(dataFile);
    } catch (e) {
      if (e.code === 'ENOENT') FS.writeFileSync(this.#config.dataFile, '{}');
      else if (e.code === 'EACCES') throw new Error('The database file could not be accessed');
    }
  }
}

module.exports = Database;