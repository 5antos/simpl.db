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
   * Fetches the data directly from the JSON file and returns the one that matches the provided filter.
   * Fetches and returns all the data from the collection if no filter is provided.
   * @param {Function} [filter] Filter to apply
   * @returns {Data|Data[]}
   */
  fetch(filter=(()=>true)) {
    this.#checkFilter(filter);

    const filtered = this.#data.filter(filter);

    return filtered.length === 1 && !!arguments[0] ? filtered[0] : !filtered.length ? null : filtered;
  }

  /**
   * Returns the data that matches the provided filter.
   * Returns all the data from the collection if no filter is provided.
   * @param {Function} [filter] Filter to apply
   * @returns {Data|Data[]}
   */
  get(filter=(()=>true)) {
    this.#checkFilter(filter);

    const filtered = this.#data.filter(filter);

    return filtered.length === 1 && !!arguments[0] ? filtered[0] : !filtered.length ? null : filtered;
  }

  /**
   * Returns the data that matches the provided filter or, if no data is found, creates and pushes a new entry into the collection with the provided data.
   * @param {Function} filter Filter to apply
   * @param {Data} data Entry's data
   * @returns {Data|Data[]}
   */
  getOrCreate(filter, data) {
    this.#checkFilter(filter);

    const filtered = this.#data.filter(filter);

    if (!filtered.length)
      this.create(data);

    return this.get(filter);
  }

  /**
   * Checks if there is any data matching the provided filter.
   * @param filter Filter to apply
   * @returns {boolean}
   */
  has(filter) {
    return this.get(filter)?.length !== 0
  }

  /**
   * Returns one ore more random entries from the collection.
   * @param {number} [amount] Number of entries to return
   */
  random(amount=1) {
    if (typeof amount !== 'number' || amount <= 0) throw new TypeError('The amount of entries must be a number bigger than 0 (zero).');
    else if (amount > this.#data.length) throw new RangeError('The provided amount of entries exceeds the total amount of entries from the collection.');

    const randomS = this.#data.sort(() => 0.5 - Math.random()).slice(0, amount);

    return randomS.length === 1 ? randomS[0] : randomS;
  }

  /**
   * Removes the data that matches the provided filter.
   * Removes all the data from the collection if no filter is provided.
   * @param {Function} [filter] Filter to apply. If this parameter is not provided, all data from the collection will be removed
   * @returns {Data[]}
   */
  remove(filter=(()=>true)) {
    this.#checkFilter(filter);

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
  update(data, filter=(()=>true)) {
    if (!data || !isObject(data)) throw new Error('The data must be an object.');
    
    this.#checkFilter(filter);

    const newData = this.#data.filter(filter);

    for (var i = 0; i < newData.length; i++)
      for (var d in data)
        newData[i][d] = data[d];

    if (this.#config.autoSave) this.save();

    return this.#data;
  }

  /**
   * Updates the data from the collection that matches the provided filter with the provided data or, if no data is found, creates and pushes a new entry into the collection with the provided data.
   * @param {Data} data The data to replace the one returned by the filter with or to use in the new entry's creation
   * @param {Function} filter Filter to apply
   * @returns {Data|Data[]}
   */
  updateOrCreate(data, filter) {
    this.#checkFilter(filter);

    const filtered = this.#data.filter(filter);

    if (!filtered.length)
      this.create(data);

    return this.update(data, filter)
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

  #checkFilter(filter) {
    if (typeof filter !== 'function') throw new TypeError('The filter must be a function.');
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