'use strict';

const FS = require('fs');
const path = require('path');
const { isObject } = require('./Utils');

/**
 * @typedef {import('simpl.db').Data} Data
 */

class Collection {
  #config;
  #data;
  #defaultValues;

  /**
   * Represents a collection where data is stored separately from the main data, in a different file.
   * @constructor
   * @param {object} config The configuration to use in the collection
   * @param {boolean} [config.autoSave] Whether or not to write data into the JSON file everytime it is updated
   * @param {string} [config.folderPath] The path where the collection's data will be stored
   * @param {string} [config.tabSize] The size of the tab in the JSON file (indentation)
   * @param {string} name The name of the collection
   * @param {Data} defaultValues Default values for omitted keys
   */
  constructor(config, name, defaultValues) {
    this.#checkName(name);
    this.#checkDefaultValues(defaultValues);

    this.#config = config;
    this.#data = this.#fetchData() || [];
    this.entries = this.#data.length;
  }

  /**
   * Creates and pushes a new entry into the collection.
   * @param {Data} data Entry's data
   * @returns {Data[]}
   */
  create(data) {
    this.#checkEntry(data);

    this.#data.push(data);

    if (this.#config.autoSave) this.save();

    return this.#data;
  }

  /**
   * Returns the data that matches the provided filter.
   * Returns all the data from the collection if no filter is provided.
   * @param {Function} [filter] Filter to apply. If this parameter is not provided, all data from the collection will be returned
   * @returns {Data|Data[]}
   */
  get(filter=(()=>true)) {
    if (typeof filter !== 'function') throw new TypeError('The filter must be a function.');

    const filtered = this.#data.filter(filter);

    return filtered.length === 1 && !!arguments[0] ? filtered[0] : filtered;
  }

  /**
   * Checks if there is any data matching the provided filter.
   * @param filter Filter to apply.
   * @returns {boolean}
   */
  has(filter) {
    return this.get(filter)?.length !== 0
  }

  /**
   * Removes the data that matches the provided filter.
   * Removes all the data from the collection if no filter is provided.
   * @param {Function} [filter] Filter to apply. If this parameter is not provided, all data from the collection will be removed
   * @returns {Data[]}
   */
  remove(filter=(()=>true)) {
    if (typeof filter !== 'function') throw new TypeError('The filter must be a function.');

    const filtered = this.#data.filter(filter);

    this.#data = this.#data.filter(d => !filtered.includes(d));

    if (this.#config.autoSave) this.save();

    return this.#data;
  }

  /**
   * Writes the cached data into the collection's JSON file.
   */
  save() {
    this.entries = this.#data.length;

    try {
      FS.writeFileSync(`${this.#config.folderPath}/${this.name}.json`, JSON.stringify(this.#data, null, this.#config.tabSize));
    } catch (e) {
      if (e.code === 'EACCES') throw new Error('The file of the collection cannot be accessed.');
    }
  }

  /**
   * Updates the data from the collection that matches the provided filter with the provided data.
   * Updates all the data from the collection if no filter is provided.
   * @param {Data} data The data to replace the one returned by the filter with
   * @param {Function} [filter] Filter to apply. If this parameter is not provided, all data from the collection will be updated
   * @returns
   */
  update(data, filter) {
    if (!data || !isObject(data)) throw new Error('The data must be an object.');

    if (!filter) filter = ()=>true;
    else if (typeof filter !== 'function') throw new TypeError('The filter must be a function.');

    const newData = this.#data.filter(filter);

    for (var i = 0; i < newData.length; i++)
      for (var d in data)
        newData[i][d] = data[d];

    if (this.#config.autoSave) this.save();

    return this.#data;
  }



  /* ==================== Private Methods ==================== */

  #checkDefaultValues(defaultValues) {
    if (!isObject(defaultValues)) throw new TypeError('The defaultValues option must be an object.');

    this.#defaultValues = defaultValues;
  }

  #checkEntry(entry) {
    if (!isObject(entry)) throw new TypeError('Provided entry must be an object.');

    const defaults = Object.entries(this.#defaultValues);

    for (var i = 0; i < defaults.length; i++)
      if (!entry.hasOwnProperty(defaults[i][0]))
        entry[defaults[i][0]] = defaults[i][1];
  }

  #checkName(name) {
    if (typeof name !== 'string') throw new TypeError('The name for the collection must be a string.');
    else if (!name.length) throw new TypeError('The provided name for the collection is invalid.');

    this.name = name;
  }

  #fetchData() {
    const dataPath = `${this.#config.folderPath}/${this.name}.json`;

    try {
      return JSON.parse(FS.readFileSync(dataPath, 'utf8'));
    } catch (e) {
      if (e.code === 'ENOENT') {
        FS.writeFileSync(dataPath, '[]');
        return [];
      }
      else if (e.code === 'EACCES') throw new Error('The file of the collection cannot be accessed.');
    }
  }
}

module.exports = Collection;