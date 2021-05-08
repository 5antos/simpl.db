import { Data } from './Utils';
import { DBConfig } from './Config';
import * as FS from 'fs';
import get from 'lodash/get';
import set from 'lodash/set';
import unset from 'lodash/unset';
import pickBy from 'lodash/pickBy';

class SimplDB {
  private readonly config: DBConfig;
  private data: Data = {};

  constructor(config: { filePath: string; saveOnUpdate: boolean; tabSize: number }) {
    this.validatePath(config.filePath);
    this.config = config;
    this.checkJSON();
    this.data = this.fetchData();
  }

  private checkJSON(): void {
    if (!FS.readFileSync(this.config.filePath, 'utf8')) this.save();
  }

  private validatePath(filePath: string): void | never {
    try {
      FS.lstatSync(filePath);
    } catch (e) {
      if (e.code === 'ENOENT') throw new ReferenceError('Provided file does not exist.');
      else if (e.code === 'EACCES') throw new Error('Provided file cannot be accessed.');
    }
  }

  private validateJSON(json: JSON): boolean {
    try {
      JSON.parse(JSON.stringify(json));
    } catch (e) {
      return false;
    }
    return true;
  }

  private fetchData(): Data | never {
    try {
      return JSON.parse(FS.readFileSync(this.config.filePath, 'utf8'));
    } catch (e) {
      throw e;
    }
  }

  private addOrSubtract(operation: string, key: string, value: number): number | never {
    let existentData = get(this.data, key);

    if (isNaN(value)) throw new TypeError('The provided value is not a number.');
    else if (!!existentData && isNaN(existentData))
      throw new TypeError('The value from the provided key is not a number.');
    else if (!existentData) existentData = 0;

    set(this.data, key, operation === 'add' ? existentData + value : existentData - value);

    if (this.config.saveOnUpdate) this.save();

    return get(this.data, key);
  }

  /* Public methods */

  public set(key: string, value: any): void {
    set(this.data, key, value);

    if (this.config.saveOnUpdate) this.save();

    return get(this.data, key);
  }

  public add(key: string, value: number): number | never {
    return this.addOrSubtract('add', key, value);
  }

  public subtract(key: string, value: number): number | never {
    return this.addOrSubtract('subtract', key, value);
  }

  public push(key: string, value: any): Data {
    let oldArray = get(this.data, key);

    if (!oldArray) oldArray = [];
    else if (!(oldArray instanceof Array)) throw new TypeError('Provided key is not an array.');

    oldArray.push(value);

    set(this.data, key, oldArray);

    if (this.config.saveOnUpdate) this.save();

    return get(this.data, key);
  }

  public pull(key: string, value: any): void {
    let oldArray = get(this.data, key);

    if (!(oldArray instanceof Array)) throw new TypeError('Provided key is not an array.');

    oldArray = oldArray.filter((v: any) => v !== value);

    set(this.data, key, oldArray);

    if (this.config.saveOnUpdate) this.save();

    return get(this.data, key);
  }

  public get(key: string): any {
    return get(this.data, key);
  }

  public has(key: string): boolean {
    return this.data.hasOwnProperty(key);
  }

  public delete(key: string): boolean {
    const deleted = unset(this.data, key);

    if (this.config.saveOnUpdate) this.save();

    return deleted;
  }

  public filter(callback: (value: Data, index: number, array: Data) => value is any): Data {
    return pickBy(this.data, callback);
  }

  public clear(): boolean {
    this.data = {};
    if (this.config.saveOnUpdate) this.save();
    return !this.data;
  }

  public replaceWith(json: JSON): void | false {
    this.data = json;
    if (!this.validateJSON(json)) return false;
    if (this.config.saveOnUpdate) this.save();
  }

  public toJSON(): JSON | never {
    try {
      return JSON.parse(JSON.stringify(this.data));
    } catch (e) {
      throw new TypeError('Provided argument is not a valid JSON object.');
    }
  }

  public save(): void {
    try {
      FS.writeFileSync(this.config.filePath, JSON.stringify(this.data, null, this.config.tabSize));
    } catch (e) {
      throw e;
    }
  }
}
