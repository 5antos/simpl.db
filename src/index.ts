import { Data } from './Utils';
import { DBConfig } from './Config';
import * as FS from 'fs';

export class SimplDB {
  private readonly config: DBConfig;
  private data: Data = {};

  constructor(config: { filePath: string; saveOnUpdate: boolean; tabSize: number }) {
    this.config = config;
    this.checkJSON();
    this.data = this.fetchData();
  }

  private checkJSON(): void {
    if (!FS.readFileSync(this.config.filePath, 'utf8')) this.save();
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

  public set(key: string, value: any): void {
    this.data[key] = value;
    if (this.config.saveOnUpdate) this.save();
  }

  public push(key: string, value: any): void {
    if (this.data[key] instanceof Array) this.data[key].push(value);
    else if (!(this.data[key] instanceof Array) && !this.data[key]) this.data[key] = [value];
    else throw new Error('Provided key is not an array.');

    if (this.config.saveOnUpdate) this.save();
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
      throw new Error('Provided argument is not a valid JSON object.');
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
