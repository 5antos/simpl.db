/* eslint-disable no-prototype-builtins */

'use strict';

const FS = require('fs');
const { join } = require('path');
const { isObject } = require('./Utils');

class Collection {
  #config;
  #data;
  #defaultValues;

  constructor(name, config, defaultValues) {
    this.#checkName(name);
    this.#checkDefaultValues(defaultValues);

    this.#config = Object.assign({
      autoSave: true,
      folderPath: './collections',
      tabSize: 0,
      timestamps: false
    }, config);

    this.#data = this.#fetchData() ?? [];
    this.entries = this.#data.length ?? 0;
  }

  
  create(data) {
    this.#checkEntry(data);

    const now = Date.now();
    const entry = { ...data, ...(this.#config.timestamps ? { createdAt: now, updatedAt: now } : {}) };

    this.#data.push(entry);
    this.entries = this.#data.length;

    if (this.#config.autoSave) this.save();

    return { ...Object.fromEntries(Object.entries(this.#defaultValues).filter(([k]) => !Object.keys(this.#defaultValues).includes(k))), ...entry };
  }

  createBulk(entries) {
    if (!Array.isArray(entries)) throw new TypeError('The entries parameter must be an array');

    for (var i = 0; i < entries.length; i++)
      this.#checkEntry(entries[i], i);

    const now = Date.now();
    const entry = this.#config.timestamps ? { createdAt: now, updatedAt: now } : {};

    this.#data.push(...entries.map(e => ({ ...e, ...entry })));
    this.entries = this.#data.length;

    if (this.#config.autoSave) this.save();

    return entries.map(e => ({ ...Object.fromEntries(Object.entries(this.#defaultValues).filter(([k]) => !Object.keys(this.#defaultValues).includes(k))), ...e, ...entry }));
  }

  fetch(filter) {
    this.#checkFunction(filter);

    const entry = this.#fetchData().find(filter);

    if (entry) entry.save = () => this.update(()=>{}, document => !!document.save);

    return entry ?? null;
  }

  fetchAll() {
    const data = this.#fetchData();

    for (var i = 0; i < data.length; i++)
      data[i].save = () => this.update(()=>{}, document => !!document.save);

    return data;
  }

  fetchMany(filter) {
    this.#checkFunction(filter);

    const filtered = this.#fetchData().filter(filter);

    for (var i = 0; i < filtered.length; i++)
      filtered[i].save = () => this.update(()=>{}, document => !!document.save);

    return filtered;
  }

  fetchOrCreate(filter, data) {
    if (!this.has(filter))
      return this.create(data);

    return this.fetch(filter);
  }

  get(filter) {
    this.#checkFunction(filter);

    const entry = this.#data.find(filter);

    if (entry) entry.save = () => this.update(()=>{}, document => !!document.save);

    return entry ?? null;
  }

  getAll() {
    const data = this.#data;

    for (var i = 0; i < data.length; i++)
      data[i].save = () => this.update(()=>{}, document => !!document.save);

    return data;
  }

  getMany(filter) {
    this.#checkFunction(filter);

    const filtered = this.#data.filter(filter);

    for (var i = 0; i < filtered.length; i++)
      filtered[i].save = () => this.update(()=>{}, document => !!document.save);

    return filtered;
  }

  getOrCreate(filter, data) {
    if (!this.has(filter))
      return this.create(data);

    return this.get(filter);
  }

  has(filter) {
    this.#checkFunction(filter);

    const data = this.get(filter);

    return !!data || data?.length > 0;
  }

  random(amount=1) {
    if (typeof amount !== 'number' || amount <= 0) throw new TypeError('The amount of entries must be a number bigger than 0 (zero)');
    else if (amount > this.#data.length) throw new RangeError('The provided amount of entries exceeds the total amount of entries from the collection');

    const randomS = this.#data.sort(() => 0.5 - Math.random()).slice(0, amount);

    return randomS.length === 1 ? randomS[0] : randomS;
  }

  remove(filter=(()=>true)) {
    this.#checkFunction(filter);

    const filtered = this.#data.filter(filter);

    this.#data = this.#data.filter(d => !filtered.includes(d));
    this.entries = this.#data.length;

    if (this.#config.autoSave) this.save();

    return filtered;
  }

  reset(filter=(()=>true)) {
    return this.update(
      entry => {
        const defaults = Object.fromEntries(Object.entries(this.#defaultValues).filter(([k]) => !k.startsWith('$')));

        for (const val in entry)
          if (defaults.hasOwnProperty(val) && !['createdAt', 'updatedAt'].includes(val))
            entry[val] = defaults[val];
      },
      filter
    );
  }

  save() {
    this.entries = this.#data.length;

    try {
      FS.writeFileSync(join(this.#config.folderPath, `${this.name}.json`), JSON.stringify(this.#data, null, this.#config.tabSize));
    } catch (e) {
      if (e.code === 'EACCES') throw new Error('The collection\'s file could not be accessed');
    }
  }

  update(updateCallback, filter=(()=>true)) {
    this.#checkFunction(updateCallback);
    this.#checkFunction(filter);

    const newData = this.#data.filter(filter);

    const now = Date.now();

    for (var i = 0; i < newData.length; i++) {
      if (this.#config.timestamps) newData[i].updatedAt = now;

      updateCallback(newData[i]);
    }

    if (this.#config.autoSave && newData.length) this.save();

    return newData;
  }



  /* ==================== Private Methods ==================== */

  #checkDefaultValues(defaultValues) {
    if (!isObject(defaultValues)) throw new TypeError('The defaultValues option must be an object');

    this.#defaultValues = defaultValues;
  }

  #checkEntry(entry, bulkIndex=0) {
    if (!isObject(entry)) throw new TypeError('Provided entry must be an object');

    const defaults = Object.entries(this.#defaultValues);

    for (var i = 0; i < defaults.length && i <= (bulkIndex || Infinity); i++)
      if (!entry.hasOwnProperty(defaults[i][0]))
        if (defaults[i][0].startsWith('$')) {
          const propertyName = defaults[i][0].slice(1);
          const validEntries = this.#data.filter(e => e.hasOwnProperty(propertyName));
          const lastValue = validEntries[validEntries.length-1]?.[propertyName] ?? -1;

          entry[propertyName] = isNaN(lastValue) ? defaults[i][1] : lastValue + 1 + bulkIndex;
        }
        else
          entry[defaults[i][0]] = defaults[i][1]; 
  }

  #checkFunction(filter) {
    if (typeof filter !== 'function') throw new TypeError('The provided parameter must be a function');
  }

  #checkName(name) {
    if (typeof name !== 'string') throw new TypeError('The name for the collection must be a string');
    else if (!name.length) throw new TypeError('The provided name for the collection is invalid');

    this.name = name;
  }

  #fetchData() {
    const dataPath = join(this.#config.folderPath, `${this.name}.json`);

    try {
      return JSON.parse(FS.readFileSync(dataPath, 'utf8'));
    } catch (e) {
      if (e.code === 'ENOENT') {
        FS.writeFileSync(dataPath, '[]');
        return [];
      }
      else if (e.code === 'EACCES') throw new Error('The collection\'s file could not be accessed');
    }
  }
}

module.exports = Collection;