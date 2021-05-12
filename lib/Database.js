"use strict"

const FS = require('fs');
const path = require('path');
const { get, set, unset } = require('lodash');
const crypto = require('crypto');

class Database {
  /**
   * Represents the Database structure for SimplDB
   * @property {object} config The configuration to be used in the database
   * @property {string} config.filePath The path of the JSON file (from the root of the project) to store data in
   * @property {string} [config.encryptionKey] The Encryption Key to be used when encrypting and decrypting data
   * @property {boolean} [config.saveOnUpdate] Whether or not to write new data to the JSON file everytime it is updated
   * @property {number} [config.tabSize] The size of the tab before each key (indentation)
   */
  constructor(config) {
    this._validatePath(config.filePath);

    this.data = {};
    this.config = Object.assign({
      filePath: null,
      encryptionKey: null,
      saveOnUpdate: true,
      tabSize: 2
    }, config);

    this._validateEncryptionKey(config.encryptionKey);
    this._checkJSON();
    this.data = this._fetchData();
  }

  /**
   * Adds the provided value to the value of the provided key
   * If no existing number, the provided value will be added to 0 (zero)
   * @param {string} key The key that will have its value incremented
   * @param {number} value The value to increment
   * @returns {number|object}
   */
  add(key, value) {
    return this._addOrSubtract('add', key, value);
  }

  /**
   * Clears the database. This action is irreversible!
   */
  clear() {
    this.data = {};
    if (this.config.saveOnUpdate) this.save();
  }

  /**
   * Deletes a key
   * Returns a boolean based on whether the key was successfully deleted or not
   * @param {string} key The key to delete
   * @returns {boolean}
   */
  delete(key) {
    const deleted = unset(this.data, key);

    if (this.config.saveOnUpdate) this.save();

    return deleted;
  }

  /**
   * Returns the value of the provided key
   * @param {string} key The key to get the value from
   * @param {boolean} [decrypt=false] Whether or not to decrypt the returned value. Defaults to false
   * @returns {any}
   */
  get(key, decrypt=false) {
    if (typeof decrypt !== 'boolean') throw new TypeError('Parameter \'decrypt\' must be of type boolean.');

    const data = get(this.data, key);

    return (!this.config.encryptionKey || !decrypt) ? data : this._decrypt(data);
  }

  /**
   * Returns a boolean based on whether an element or property exists or not
   * @param {string} key The key that will be checked
   * @returns {boolean}
   */
  has(key) {
    return get(this.data, key) !== undefined;
  }

  /**
   * Pulls all elements with the same value as the provided value from an array based on the provided key
   * @param {string} key The key of the target array
   * @param {any} value The value to pull from the array
   * @returns {any[]|never}
   */
  pull(key, value) {
    let oldArray = get(this.data, key);

    if (!(Array.isArray(oldArray)) && oldArray !== undefined) throw new TypeError('The value from the provided key is not an array.');
    else if (oldArray === undefined) oldArray = [];

    oldArray = oldArray.filter(v => v !== value);
    set(this.data, key, oldArray);

    if (this.config.saveOnUpdate) this.save();

    return get(this.data, key.split('.')[0]);
  }

  /**
   * Pushes an element into an array based on the provided key
   * @param {string} key The key of the target array
   * @param {any} value The value to push into the array
   * @returns {any[]|never}
   */
  push(key, value) {
    let oldArray = get(this.data, key);

    if (!(Array.isArray(oldArray)) && oldArray !== undefined) throw new TypeError('The value from the provided key is not an array.');
    else if (oldArray === undefined) oldArray = [];

    oldArray.push(value);
    set(this.data, key, oldArray);

    if (this.config.saveOnUpdate) this.save();

    return get(this.data, key.split('.')[0]);
  }

  /**
   * Writes the cached data into the JSON file (database)
   */
  save() {
    this._validatePath(this.config.filePath);
    try {
      FS.writeFileSync(this.config.filePath, JSON.stringify(this.data, null, this.config.tabSize));
    } catch (e) {
      if (e.code === 'ENOENT') throw new ReferenceError('The provided file does not exist.');
      else if (e.code === 'EACCES') throw new Error('The provided file cannot be accessed.');
    }
  }

  /**
   * Sets a new value to the value of the provided key
   * @param {string} key The target key
   * @param {any} value The value to set
   * @param {boolean} [encrypt=false] Whether or not to encrypt the value before setting it. Defaults to false
   * @returns {any}
   */
  set(key, value, encrypt=false) {
    if (typeof encrypt !== 'boolean') throw new TypeError('Parameter \'encrypt\' must be of type boolean.');

    if (!this.config.encryptionKey || !encrypt) set(this.data, key, value);
    else if (encrypt) set(this.data, key, this._encrypt(value));

    if (this.config.saveOnUpdate) this.save();

    return get(this.data, key.split('.')[0]);
  }

  /**
   * Subtracts the provided value from the value of the provided key
   * If no existing number, the provided value will be subtracted from 0 (zero)
   * @param {string} key The key that will have its value decremented
   * @param {number} value The value to decrement
   * @returns {number|object}
   */
  subtract(key, value) {
    return this._addOrSubtract('subtract', key, value);
  }

  _addOrSubtract(operation, key, value) {
    let existentData = get(this.data, key);

    if (isNaN(value)) throw new TypeError('The provided value is not a number.');
    else if (!!existentData && typeof existentData !== 'number')
      throw new TypeError('The value from the provided key is not a number.');
    else if (!existentData) existentData = 0;

    set(this.data, key, operation === 'add' ? existentData + value : existentData - value);

    if (this.config.saveOnUpdate) this.save();

    return get(this.data, key.split('.')[0]);
  }

  _checkJSON() {
    try {
      const fileContent = FS.readFileSync(this.config.filePath, 'utf8');

      if (!fileContent || Array.isArray(JSON.parse(fileContent))) {
        this.data = {};
        this.save();
      }
    } catch(e) {
      if (e.code === 'ENOENT') throw new ReferenceError('The provided file does not exist.');
      else if (e.code === 'EACCES') throw new Error('The provided file cannot be accessed.');
    }
  }

  // @vlucas, https://gist.github.com/vlucas/2bd40f62d20c1d49237a109d491974eb
  _decrypt(string) {
    try {
      this._validateBeforeDecrypt(string);
      const stringParts = string.split(':');
      const iv = Buffer.from(stringParts.shift(), 'hex');
      const encryptedText = Buffer.from(stringParts.join(':'), 'hex');
      const decipher = crypto.createDecipheriv('aes-256-ctr', Buffer.from(this.config.encryptionKey), iv);
      const decrypted = Buffer.concat([decipher.update(encryptedText), decipher.final()]);

      return decrypted.toString();
    } catch (e) {
      throw new Error('An error has occurred while decrypting a value.');
    }
  }

  // @vlucas, https://gist.github.com/vlucas/2bd40f62d20c1d49237a109d491974eb
  _encrypt(string) {
    try {
      this._validateBeforeEncrypt(string);
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv('aes-256-ctr', Buffer.from(this.config.encryptionKey), iv);
      const encrypted = Buffer.concat([cipher.update(string), cipher.final()]);

      return iv.toString('hex') + ':' + encrypted.toString('hex');
    } catch (e) {
      throw new Error('An error has occurred while encrypting a value.');
    }
  }

  _fetchData() {
    try {
      return JSON.parse(FS.readFileSync(this.config.filePath, 'utf8'));
    } catch (e) {
      if (e.code === 'ENOENT') throw new ReferenceError('The provided file does not exist.');
      else if (e.code === 'EACCES') throw new Error('The provided file cannot be accessed.');
    }
  }

  _validateBeforeDecrypt(value) {
    if (Object.prototype.toString.call(value) !== "[object String]") throw new TypeError('The provided value has to be a string to be decrypted.');
    else if (value.split(':').length !== 2 || value.includes(' ')) throw new TypeError('The provided value cannot be decrypted as it was not encrypted before.');
  }

  _validateBeforeEncrypt(value) {
    if (Object.prototype.toString.call(value) !== "[object String]") throw new TypeError('The provided value has to be a string to be encrypted.');
  }

  _validateEncryptionKey(key) {
    if (this.config.encryptionKey !== null) {
      if (Object.prototype.toString.call(key) !== "[object String]") throw new TypeError('The Encryption Key must be a string.');
      else if (key.length !== 32) throw new Error('The Encryption Key must have a length of 32 characters.');
    }
  }

  _validatePath(filePath) {
    if (!filePath || !filePath.length) throw new Error('Missing file path argument.');
    else if (path.extname(filePath) !== '.json') throw new Error('Invalid file path argument. Provided path should lead to a .json file.');

    try {
      FS.lstatSync(filePath);
    } catch (e) {
      if (e.code === 'ENOENT') throw new ReferenceError('The provided file does not exist.');
      else if (e.code === 'EACCES') throw new Error('The provided file cannot be accessed.');
    }
  }

  toString() {
    return `[SimplDB - ${path.basename(this.config.filePath)}]`;
  }

  toJSON() {
    return JSON.parse(JSON.stringify(this.data));
  }
}

module.exports = Database;