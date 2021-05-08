import DB from './lib/index';

export function SimplDB(options: { filePath: string; saveOnUpdate: boolean; tabSize: number; }) {
  return new DB(options);
}