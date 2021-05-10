declare function SimplDB(config: SimplDB.Config): SimplDB.Database;

declare namespace SimplDB {
  interface Config {
    filePath: string;
    saveOnUpdate: boolean;
    tabSize: number;
  }

  interface Data {
    [key: string]: any;
  }

  export class Database {
    config: Config;
    data: { [s: string]: any };
    constructor(config: Config);
    #checkJSON;
    #validatePath;
    #fetchData;
    #addOrSubtract;
    set(key: string, value: any): void;
    add(key: string, value: number): number | never;
    subtract(key: string, value: number): number | never;
    push(key: string, value: any): Data;
    pull(key: string, value: any): void;
    get(key: string): any;
    has(key: string): boolean;
    delete(key: string): boolean;
    clear(): void;
    toJSON(): JSON | never;
    save(): void;
  }
}

export = SimplDB;