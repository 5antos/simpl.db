import DB from './lib';

export function SimplDB(options: { filePath: string; saveOnUpdate: boolean; tabSize: number; }) {
  return new DB(options);
}