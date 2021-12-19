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
    createCollection<Type extends Collection>(name: string, Collection?: Constructable<Type>, defaultValues?: Data): Type|never;
    delete(key: string): boolean|never;
    fetch(key: string): JSONData|never;
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
  type Constructable<T> = new (...args: any[]) => T
  
  export class Collection {
    #config: CollectionConfig;
    #data: Data[];
    defaultValues: Data;
    entries: number;
    name: string;
    constructor(config: CollectionConfig, name: string, defaultValues?: Data);
    #checkDefaultValues;
    #checkEntry;
    #checkFilter;
    #checkName;
    #fetchData;
    create(data: Data): Data[]|never;
    fetch(filter?: Function): Data|Data[]|never;
    fetchOrCreate(filter: Function, data: Data): Data|Data[]|never;
    get(filter?: Function): Data|Data[]|never;
    getOrCreate(filter: Function, data: Data): Data|Data[]|never;
    has(filter: Function): boolean|never;
    random(amount?: number): Data|Data[]|never;
    remove(filter?: Function): Data[]|never;
    save(): void|never;
    update(updateCallback: Function, filter?: Function): Data[]|never;
  }
}

export = SimplDB;
