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
    if (!FS.readFileSync(this.config.filePath, 'utf8')) this.saveOnUpdate();
  }

  private fetchData(): Data | never {
    try {
      return JSON.parse(FS.readFileSync(this.config.filePath, 'utf8'));
    } catch (e) {
      throw e;
    }
  }

  private saveOnUpdate(): void {
    try {
      FS.writeFileSync(this.config.filePath, JSON.stringify(this.data, null, this.config.tabSize));
    } catch (e) {
      throw e;
    }
  }

  public set(key: string, value: any): void {
    this.data[key] = value;
    if (this.config.saveOnUpdate) this.saveOnUpdate();
  }

  public get(key: string): any {
    return this.data[key];
  }

  public has(key: string): boolean {
    return this.data.hasOwnProperty(key);
  }

  public delete(key: string): boolean {
    return delete this.data[key];
  }
}
