import { Data } from './Utils';
import { DBConfig } from './Config';
import * as FS from 'fs';
import * as _ from 'lodash';

export class SimplDB {
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

  public addOrSubtract(operation: string, key: string, value: number): number | never {
    let existentData = _.get(this.data, key, value);

    if (!!existentData && isNaN(existentData)) throw new Error('The value from the provided key is not a number.');

    _.set(
      this.data,
      key,
      existentData ? (operation === 'add' ? (existentData += value) : (existentData -= value)) : value,
    );

    if (this.config.saveOnUpdate) this.save();

    return _.get(this.data, key, value);
  }

  /* Public methods */

  public set(key: string, value: any): void {
    this.data[key] = value;
    if (this.config.saveOnUpdate) this.save();
  }

  public add(key: string, value: number): void {
    this.addOrSubtract('add', key, value);
  }

  public subtract(key: string, value: number): void {
    this.addOrSubtract('subtract', key, value);
  }

  public push(key: string, value: any): any[] {
    if (this.data[key] instanceof Array) this.data[key].push(value);
    else if (!(this.data[key] instanceof Array) && !this.data[key]) this.data[key] = [value];
    else throw new TypeError('Provided key is not an array.');

    if (this.config.saveOnUpdate) this.save();

    return this.data[key];
  }

  public pull(key: string, value: any): void {
    if (this.data[key] instanceof Array) {
      if (this.data[key].includes(value)) this.data[key] = this.data[key].filter((v: any) => v !== value);
    } else throw new TypeError('Provided key is not an array.');

    if (this.config.saveOnUpdate) this.save();

    return this.data[key];
  }

  public get(key: string): any {
    return this.data[key];
  }

  public has(key: string): boolean {
    return this.data.hasOwnProperty(key);
  }

  public delete(key: string): boolean {
    if (!this.has(key)) return false;

    delete this.data[key];
    if (this.config.saveOnUpdate) this.save();
    return !this.has(key);
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
    } catch (err) {
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
