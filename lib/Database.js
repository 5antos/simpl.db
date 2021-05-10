"use strict"

const FS = require('fs');
const path = require('path');
const { get, set, unset } = require('lodash')

class Database {
  /**
   * Represents the Database structure for SimplDB
   * @property {object} config The configuration to be used in the database
   * @property {string} config.filePath The path of the JSON file (from the root of the project) to store data in
   * @property {boolean} config.saveOnUpdate Whether or not to to write new data to the JSON file everytime the data is updated
   * @property {number} config.tabSize The size of the tab before each key (indentation)
   */
  constructor(config) {
    this.data = {}
    this.config = Object.assign({
      filePath: null,
      saveOnUpdate: true,
      tabSize: 2,
    }, config);
  }

  /**
   * Adds the provided value to the value of the provided key in the database
   * @param key The key that will have its value increased
   * @param value The value to add
   * @returns {number}
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
   * Deletes a key from the database. Returns a boolean based on whether the key was successfully deleted or not
   * @param key The key to delete
   * @returns {boolean}
   */
  delete(key) {
    const deleted = unset(this.data, key);

    if (this.config.saveOnUpdate) this.save();

    return deleted;
  }

  /**
   * Returns a value from the database based on the provided key
   * @param key The key to get the value from
   * @returns {any}
   */
  get(key) {
    return get(this.data, key);
  }

  /**
   * Returns a boolean based on whether an element or property exists in the database
   * @param key The key that will be checked
   * @returns {boolean}
   */
  has(key) {
    return get(this.data, key) !== undefined;
  }

  /**
   * Pulls all elements with the same value as the provided value from an array in the database based on the provided key
   * @param key The key of the target array
   * @param value The target array
   * @returns {any|never}
   */
  pull(key, value) {
    let oldArray = get(this.data, key);

    if (!(Array.isArray(oldArray)) && oldArray !== undefined) throw new TypeError('The value from the provided key is not an array.');
    else if (oldArray === undefined) oldArray = []

    oldArray = oldArray.filter(v => v !== value);
    set(this.data, key, oldArray);

    if (this.config.saveOnUpdate) this.save();

    return get(this.data, key);
  }

  /**
   * Pushes an element into an array in the database based on the provided key
   * @param key The key of the target array
   * @param value The target array
   * @returns {any|never}
   */
  push(key, value) {
    let oldArray = get(this.data, key);

    if (!(Array.isArray(oldArray)) && oldArray !== undefined) throw new TypeError('The value from the provided key is not an array.');
    else if (oldArray === undefined) oldArray = []

    oldArray.push(value);
    set(this.data, key, oldArray);

    if (this.config.saveOnUpdate) this.save();

    return get(this.data, key);
  }

  /**
   * Writes the cached data into the JSON file
   */
  save() {
    this._checkJSON();
    try {
      FS.writeFileSync(this.config.filePath, JSON.stringify(this.data, null, this.config.tabSize));
    } catch (e) {
      if (e.code === 'ENOENT') throw new ReferenceError('Provided file does not exist.');
      else if (e.code === 'EACCES') throw new Error('Provided file cannot be accessed.');

      throw e;
    }
  }

  /**
   * Sets new data in the database based on the provided key
   * @param key The key that will have its value set
   * @param value The value to set/replace
   * @returns {any}
   */
  set(key, value) {
    set(this.data, key, value);

    if (this.config.saveOnUpdate) this.save();

    return get(this.data, key);
  }

  /**
   * Subtracts the provided value from the value of the provided key in the database
   * @param key The key that will have its value decreased
   * @param value The value to subtract
   * @returns {number}
   */
  subtract(key, value) {
    return this._addOrSubtract('subtract', key, value);
  }

  _addOrSubtract(operation, key, value) {
    let existentData = get(this.data, key);

    if (isNaN(value)) throw new TypeError('The provided value is not a number.');
    else if (!!existentData && isNaN(existentData))
      throw new TypeError('The value from the provided key is not a number.');
    else if (!existentData) existentData = 0;

    set(this.data, key, operation === 'add' ? existentData + value : existentData - value);

    if (this.config.saveOnUpdate) this.save();

    return get(this.data, key);
  }

  _checkJSON() {
    try {
      if (!FS.readFileSync(this.config.filePath, 'utf8')) this.save();
    } catch(e) {
      if (e.code === 'ENOENT') throw new ReferenceError('Provided file does not exist.');
      else if (e.code === 'EACCES') throw new Error('Provided file cannot be accessed.');
    }

  }

  _fetchData() {
    try {
      return JSON.parse(FS.readFileSync(this.config.filePath, 'utf8'));
    } catch (e) {
      throw e;
    }
  }

  _validatePath(filePath) {
    if (!filePath || !filePath.length) throw new Error('Missing file path argument.');
    else if (path.extname(filePath) !== '.json') throw new Error('Invalid file path argument. Provided path should lead to a .json file.');

    try {
      FS.lstatSync(filePath);
    } catch (e) {
      if (e.code === 'ENOENT') throw new ReferenceError('Provided file does not exist.');
      else if (e.code === 'EACCES') throw new Error('Provided file cannot be accessed.');
    }
  }

  toString() {
    return `[SimplDB - ${path.basename(this.config.filePath)}]`;
  }

  toJSON() {
    return JSON.parse(JSON.stringify(this.data));
  }
}