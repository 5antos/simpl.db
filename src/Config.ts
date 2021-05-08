import { lstatSync } from 'fs';
import { extname } from 'path';

export interface DBConfig {
  filePath: string;
  saveOnUpdate: boolean;
  tabSize: number;
}

export class Config implements DBConfig {
  filePath: string;
  saveOnUpdate: boolean;
  tabSize: number;

  constructor(filePath: string, saveOnUpdate: boolean, tabSize: number) {
    this.validateFilePath(filePath);
    this.filePath = filePath;
    this.saveOnUpdate = saveOnUpdate || true;
    this.tabSize = tabSize || 4;
  }

  private validateFilePath(path: string) {
    if (!path || !path.length) throw new Error('Missing file path argument.');
    else if (!lstatSync(path).isFile() || extname(path) !== '.json')
      throw new Error('Invalid file path argument. Provided path should lead to a .json file.');
  }
}
