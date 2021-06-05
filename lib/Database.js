'use strict';

const FS = require('fs');
const path = require('path');
const crypto = require('crypto');
const Collection = require('./Collection');
const { isObject, isValidKey } = require('./Utils');

/**
 * @typedef {import('simpl.db').Data} Data
 * @typedef {import('simpl.db').JSONData} JSONData
 */

class Database {
  #config;
  #data;

  /**
   * Represents the Database structure for SimplDB.
   * @constructor
   * @property {object} config The configuration to be used in the database
   * @property {string} [config.dataFile] The path of the JSON file (from the root of the project) to store data in
   * @property {boolean} [config.autoSave] Whether or not to write new data to the JSON file everytime it is updated
   * @property {string} [config.collectionsFolder] The path to a folder where collections' data will be stored
   * @property {string} [config.encryptionKey] The Encryption Key to be used when encrypting and decrypting data
   * @property {number} [config.tabSize] The size of the tab in the JSON file (indentation)
   */
  constructor(config) {
    this.collections = [];
    this.#config = Object.assign({
      dataFile: './database.json',
      collectionsFolder: './collections',
      autoSave: true,
      encryptionKey: null,
      tabSize: 2
    }, config);

    this.#data = {};
    this.version = require('../package.json').version;

    this.#validatePath(this.#config?.dataFile);
    this.#validateFolderPath(this.#config?.collectionsFolder);
    this.#validateEncryptionKey(this.#config.encryptionKey);
    this.#checkJSON();
    this.#data = this.#fetchData();
  }

  /**
   * Adds the provided value to the value of the provided key.
   * If no existing number, the provided value will be added to 0 (zero).
   * @param {string} key The key that will have its value incremented
   * @param {number} value The value to increment
   * @returns {number|Data}
   */
  add(key, value) {
    return this.#addOrSubtract('add', key, value);
  }

  /**
   * Clears the database.
   */
  clear() {
    this.#data = {};
    if (this.#config.autoSave) this.save();
  }

  /**
   * Creates a new collection.
   * @param {string} name The name for the collection
   * @param {Data} defaultValues Default values for omitted keys
   * @returns {Collection}
   */
  createCollection(name, defaultValues) {
    if (!isValidKey(name)) throw new TypeError('The provided name is invalid.');

    const newCollection = new Collection({ folderPath: this.#config.collectionsFolder, tabSize: this.#config.tabSize, autoSave: this.#config.autoSave }, name, defaultValues);
    this.collections.push(newCollection);

    return newCollection;
  }

  /**
   * Deletes a key.
   * Returns a boolean based on whether the key was successfully deleted or not.
   * @param {string} key The key to delete
   * @returns {boolean}
   */
  delete(key) {
    if (!isValidKey(key)) throw new TypeError('The provided key is invalid.');

    const data = this.get(key);

    key.split('.').reduce((o, curr, i, arr) => {
      if (i === arr.length-1) delete o?.[curr];
      else return o?.[curr];
    }, this.#data);

    if (this.#config.autoSave) this.save();

    return !!data && this.get(key) === undefined;
  }

  /**
   * Returns the value of the provided key.
   * @param {string} key The key to get the value from
   * @param {boolean} [decrypt=false] Whether or not to decrypt the returned value. Defaults to false
   * @returns {JSONData}
   */
  get(key, decrypt=false) {
    if (!isValidKey(key)) throw new TypeError('The provided key is invalid.');
    else if (typeof decrypt !== 'boolean') throw new TypeError('Parameter decrypt must be of type boolean.');
    else if (decrypt && !this.#config.encryptionKey) throw new Error('Missing Encryption Key.');

    const data = key.split('.').reduce((acc, curr) => acc?.[curr], this.#data);

    return !decrypt ? data : this.#decrypt(data);
  }

  /**
   * Returns a boolean based on whether an element or property exists or not.
   * @param {string} key The key that will be checked
   * @returns {boolean}
   */
  has(key) {
    if (!isValidKey(key)) throw new TypeError('The provided key is invalid.');

    return this.get(key) !== undefined;
  }

  /**
   * Removes all elements with the same value as the provided value from an array based on the provided key.
   * @param {string} key The key of the target array
   * @param {JSONData} value The value to remove from the array
   * @returns {JSONData|never}
   */
  pull(key, value) {
    if (!isValidKey(key)) throw new TypeError('The provided key is invalid.');
    else if (value === undefined) throw new TypeError('A valid value must be provided.');

    const oldArray = this.get(key) || [];

    if (!(Array.isArray(oldArray)) && oldArray !== undefined) throw new TypeError('The value from the provided key must be an array.');

    this.set(key, oldArray.filter(v => v !== value));

    if (this.#config.autoSave) this.save();

    return this.get(key.split('.')[0]);
  }

  /**
   * Pushes an element into an array based on the provided key.
   * @param {string} key The key of the target array
   * @param {JSONData} value The value to push into the array
   * @returns {JSONData|never}
   */
  push(key, value) {
    if (!isValidKey(key)) throw new TypeError('The provided key is invalid.');
    else if (value === undefined) throw new TypeError('A valid value must be provided.');

    const oldArray = this.get(key) || [value];

    if (!(Array.isArray(oldArray)) && oldArray !== undefined) throw new TypeError('The value from the provided key must be an array.');

    oldArray.push(value);

    this.set(key, oldArray);

    if (this.#config.autoSave) this.save();

    return this.get(key.split('.')[0]);
  }

  /**
   * Writes the cached data into the JSON file.
   */
  save() {
    try {
      FS.writeFileSync(this.#config.dataFile, JSON.stringify(this.#data, null, this.#config.tabSize));
    } catch (e) {
      if (e.code === 'EACCES') throw new Error('The database file cannot be accessed.');
    }
  }

  /**
   * Sets a new value to the value of the provided key.
   * @param {string} key The target key
   * @param {JSONData} value The value to set
   * @param {boolean} [encrypt=false] Whether or not to encrypt the value before setting it. Defaults to false
   * @returns {JSONData|Data}
   */
  set(key, value, encrypt=false) {
    if (!isValidKey(key)) throw new TypeError('The provided key is invalid.');
    else if (typeof encrypt !== 'boolean') throw new TypeError('Parameter encrypt must be of type boolean.');
    else if (encrypt && !this.#config.encryptionKey) throw new Error('Missing Encryption Key.');

    const split = key.split('.');

    if (this.get(key) !== value) {
      split.reduce((acc, curr, i, arr) => {
        try {
          if (acc[curr] === undefined && i < arr.length-1) return acc[curr] = {};

          if (i === arr.length-1) return acc[curr] = !encrypt ? value : this.#encrypt(value);

          return acc[curr];
        } catch(e) {
          if (!['An error has occurred while encrypting a value.', 'The provided value must be a string to be encrypted.'].includes(e.message)) {
            this.set(arr.slice(0, arr.length-1).join('.'), {}, encrypt);
            this.set(key, value, encrypt);
          } else throw e;
        }
      }, this.#data);

      if (this.#config.autoSave) this.save();
    }

    return this.get(split[0]);
  }

  /**
   * Subtracts the provided value from the value of the provided key.
   * If no existing number, the provided value will be subtracted from 0 (zero).
   * @param {string} key The key that will have its value decremented
   * @param {number} value The value to decrement
   * @returns {number|JSONData}
   */
  subtract(key, value) {
    return this.#addOrSubtract('subtract', key, value);
  }

  /**
   * Parses and returns all data from the database as an object.
   * @returns {Data}
   */
  toJSON() {
    return JSON.parse(JSON.stringify(this.#data));
  }



  /* ==================== Private Methods ==================== */

  #addOrSubtract(operation, key, value) {
    if (value === undefined || value === Infinity) throw new TypeError('A valid value must be provided.');
    if (!isValidKey(key)) throw new TypeError('The provided key is invalid.');

    const existentData = this.get(key) || 0;

    if (typeof value !== 'number') throw new TypeError('The provided value must be a number.');
    else if (['undefined', 'number'].every(t => typeof existentData !== t)) throw new TypeError('The value from the provided key must be a number.');

    this.set(key, operation === 'add' ? existentData + value : existentData - value);

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
      else if (e.code === 'EACCES') throw new Error('The database file cannot be accessed.');
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
      throw new Error('An error has occurred while decrypting a value.');
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
      if (e.message === 'The provided value must be a string to be encrypted.') throw e;
      else throw new Error('An error has occurred while encrypting a value.');
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
      else if (e.code === 'EACCES') throw new Error('The database file cannot be accessed.');
    }
  }

  #validateBeforeDecrypt(value) {
    if (typeof value !== 'string') throw new TypeError('The provided value must be a string to be decrypted.');
    else if (value.split(':').length !== 2 || value.includes(' ')) throw new TypeError('The provided value cannot be decrypted as it was not encrypted before.');
  }

  #validateBeforeEncrypt(value) {
    if (typeof value !== 'string') throw new TypeError('The provided value must be a string to be encrypted.');
  }

  #validateEncryptionKey(key) {
    if (this.#config.encryptionKey !== null) {
      if (typeof key !== 'string') throw new TypeError('The Encryption Key must be a string.');
      else if (key.length !== 32) throw new Error('The Encryption Key must have a length of 32 characters.');
    }
  }

  #validateFolderPath(folderPath) {
    try {
      if (!FS.statSync(folderPath).isDirectory()) throw new Error('Invalid file path argument. Provided path should lead to a folder.');
    } catch (e) {
      if (e.code === 'ENOENT') FS.mkdirSync(this.#config.collectionsFolder);
      else if (e.code === 'EACCES') throw new Error('The provided folder cannot be accessed.');
      else throw new Error(e);
    }
  }

  #validatePath(dataFile) {
    if (path.extname(dataFile) !== '.json') throw new Error('Invalid file path argument. Provided path should lead to a .json file.');

    try {
      FS.lstatSync(dataFile);
    } catch (e) {
      if (e.code === 'ENOENT') FS.writeFileSync(this.#config.dataFile, '{}');
      else if (e.code === 'EACCES') throw new Error('The database file cannot be accessed.');
    }
  }
}

module.exports = Database;