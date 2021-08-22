// declare class SimplDB {
//   constructor(config?: SimplDB.DBConfig)
// }

declare function SimplDB(config?: SimplDB.DBConfig): SimplDB.Database;

declare namespace SimplDB {
  type DBConfig = {
    autoSave?: boolean;
    collectionsFolder?: string;
    dataFile?: string;
    encryptionKey?: string;
    tabSize?: number;
  }
  
  type CollectionConfig = {
    autoSave?: boolean;
    folderPath?: string;
    tabSize?: number;
  }
  
  type JSONData = string | number | Data | JSONData[] | boolean | null;
  
  type Data = {
    [key: string]: JSONData;
  }
  
  export class Database {
    #config: DBConfig;
    #data: Data;
    collections: Collection[];
    version: string;
    constructor(config?: DBConfig);
    #addOrSubtract;
    #checkJSON;
    #decrypt;
    #encrypt;
    #fetchData;
    #validateBeforeDecrypt;
    #validateBeforeEncrypt;
    #validateEncryptionKey;
    #validateFolderPath;
    #validatePath;
    add(key: string, value: number): number|Data|never;
    clear(): void;
    createCollection(name: string, defaultValues?: Data): Collection|never;
    delete(key: string): boolean|never;
    get(key: string, decrypt?: boolean): JSONData|never;
    has(key: string): boolean|never;
    pull(key: string, value: JSONData): JSONData|never;
    push(key: string, value: JSONData): JSONData|never;
    save(): void|never;
    set(key: string, value: JSONData, encrypt?: boolean): JSONData|Data|never;
    subtract(key: string, value: number): number|JSONData|never;
    toJSON(): Data;
  }
  
  // type Filter<T extends any[]> = (...args: T) => boolean | Promise<boolean>;
  
  export class Collection {
    #config: CollectionConfig;
    #data: Data[];
    defaultValues: Data;
    entries: number;
    name: string;
    constructor(config: CollectionConfig, name: string, defaultValues: Data);
    #checkDefaultValues;
    #checkEntry;
    #checkName;
    #fetchData;
    create(data: Data): Data[]|never;
    get(filter?: Function): Data|Data[]|never;
    has(filter: Function): boolean|never;
    random(amount?: number): Data|Data[]|never;
    remove(filter?: Function): Data[]|never;
    save(): void|never;
    update(data: Data, filter?: Function): Data[]|never;
  }
}

export = SimplDB;