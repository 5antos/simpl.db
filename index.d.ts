declare function SimplDB(config?: SimplDB.DBConfig): SimplDB.Database;

declare namespace SimplDB {
  export type DBConfig = {
    autoSave?: boolean;
    collectionsFolder?: string;
    collectionTimestamps?: boolean;
    dataFile?: string;
    encryptionKey?: string;
    tabSize?: number;
  }
  
  export type CollectionConfig = {
    autoSave?: boolean;
    folderPath?: string;
    tabSize?: number;
    timestamps?: boolean;
  }
  
  export type JSONData = string | number | Data | JSONData[] | boolean | null;

  export type Incrementable<T> = {
    [Prop in keyof T]: T[Prop] extends number ? Prop : never
  }[keyof T]

  export type Extended<T> = {
    [Prop in keyof T as `$${Prop}`]: T[Prop]
  }

  export type Readable<T> = {
    readonly [Prop in keyof T]: T[Prop]
  }

  export type Writable<T> = {
    -readonly [Prop in keyof T]: T[Prop]
  }

  export type Modifiable<T> = T & {
    save(): void;
  }

  export type DefaultValues<T> = Pick<T, Incrementable<Extended<T>>> | Partial<T>;

  export type Filter<T> = (args: T) => boolean;

  export type UpdateCallback<T> = (args: T) => void;

  export type Data = {
    [key: string]: JSONData
  }
  
  /**
   * The main database.
   */
  export class Database {
    #config: DBConfig;
    #data: Data;
    
    /**
     * All the created collections.
     */
    public collections: Collection<any>[];

    /**
     * The version of the package.
     */
    public version: string;

    /**
     * @constructor
     * @param {DBConfig} config The configuration to be used in the database
     * @param {boolean} [config.autoSave] Whether or not to write new data to the JSON file everytime it is updated
     * @param {string} [config.dataFile] The path of the JSON file (from the root of the project) to store data in
     * @param {string} [config.collectionsFolder] The path to a folder where collections' data will be stored
     * @param {string} [config.collectionTimestamps] Whether or not to automatically add the attributes createdAt and updatedAt to every collection entry
     * @param {string} [config.encryptionKey] The Encryption Key to be used when encrypting and decrypting data
     * @param {number} [config.tabSize] The size of the tab in the JSON file (indentation)
     */
    constructor(config?: DBConfig);

    #checkJSON;
    #decrypt;
    #encrypt;
    #fetchData;
    #math;
    #validateBeforeDecrypt;
    #validateBeforeEncrypt;
    #validateEncryptionKey;
    #validateFolderPath;
    #validatePath;

    /**
     * Adds the provided value to the value of the provided key.
     * If no existing number, the provided value will be added to 0 (zero).
     * @param {string} key The key that will have its value incremented
     * @param {number} value The value to increment
     * @returns {T}
     */
    add<T>(key: string, value: number): T|never;

    /**
     * Clears the database.
     */
    clear(): void;

    /**
     * Creates a new collection.
     * @param {string} name The name for the collection
     * @param {DefaultValues<T>} [defaultValues={}] Default values for omitted keys
     * @returns {Collection<Readable<T>>}
     */
    createCollection<T>(name: string, defaultValues?: DefaultValues<T>): Collection<Readable<T>>|never;

    /**
     * Deletes a key.
     * @param {string} key The key to delete
     * @returns {boolean}
     */
    delete(key: string): boolean|never;

    /**
     * Deletes a collection.
     * @param {string} name The name of the collection
     * @returns {boolean}
     */
    deleteCollection(name: string): boolean|never;

    /**
     * Returns the value of the provided key directly from the JSON file.
     * @param {string} key The key to get the value from
     * @returns {T}
     */
    fetch<T extends JSONData>(key: string): T|never;

    /**
     * Returns the value of the provided key.
     * @param {string} key The key to get the value from
     * @param {boolean} [decrypt=false] Whether or not to decrypt the returned value
     * @returns {JSONData}
     */
    get<T extends JSONData>(key: string, decrypt?: boolean): T|never;

    /**
     * Returns the information and data from a collection.
     * @param {string} name The name of the collection
     * @returns {Collection<Readable<T>>|null}
     */
    getCollection<T>(name: string): Collection<Readable<T>>|null|never;

    /**
     * Checks if the provided key exists.
     * @param {string} key The key that will be checked
     * @returns {boolean}
     */
    has(key: string): boolean|never;

    /**
     * Removes all the elements with the same value as the provided value from an array based on the provided key.
     * @param {string} key The key of the target array
     * @param {JSONData} value The value to remove from the array
     * @returns {T}
     */
    pull<T extends JSONData>(key: string, value: T): T|never;

    /**
     * Pushes an element into an array based on the provided key.
     * @param {string} key The key of the target array
     * @param {JSONData} value The value to push into the array
     * @returns {T}
     */
    push<T extends JSONData>(key: string, value: T): T|never;

    /**
     * Renames a key.
     * @param {string} key The target key
     * @param {string} newName The new name for the key
     * @returns {T}
     */
    rename<T extends JSONData>(key: string, newName: string): T|never;

    /**
     * Writes the cached data into the JSON file.
     */
    save(): void|never;

    /**
     * Sets a new value to the value of the provided key.
     * @param {string} key The target key
     * @param {JSONData} value The value to set
     * @param {boolean} [encrypt=false] Whether or not to encrypt the value before setting it
     * @returns {T}
     */
    set<T extends JSONData>(key: string, value: JSONData, encrypt?: boolean): T|Data|never;

    /**
     * Subtracts the provided value from the value of the provided key.
     * If no existing number, the provided value will be subtracted from 0 (zero).
     * @param {string} key The key that will have its value decremented
     * @param {number} value The value to decrement
     * @returns {T}
     */
    subtract<T extends JSONData>(key: string, value: number): T|never;

    /**
     * Parses and returns all the data from the database as an object.
     * @returns {Data}
     */
    toJSON(): Data;

    /**
     * Updates the provided key's value with the provided callback.
     * @param {string} key The target key
     * @param {UpdateCallback<any>} updateCallback The function to call to update the data
     * @returns {T}
     */
    update<T extends JSONData>(key: string, updateCallback: UpdateCallback<T>): T|never;
  }
  
  
  /**
   * Collection where data is stored separately from the main data, in a different file.
   */
  export class Collection<T> {
    #config: CollectionConfig;
    #data: T[];
    #defaultValues: DefaultValues<T>;

    /**
     * The database where the collection is stored.
     */
    public database: Database;
    
    /**
     * The total amount of entries in the collection.
     */
    public entries: number;

    /**
     * The name of the collection.
     */
    public name: string;

    /**
     * @constructor
     * @param {string} name The name of the collection
     * @param {CollectionConfig} config The configuration to use in the collection
     * @param {boolean} config.autoSave Whether or not to write data into the JSON file everytime it is updated
     * @param {string} config.folderPath The path where the collection's data will be stored
     * @param {string} config.tabSize The size of the tab in the JSON file (indentation)
     * @param {string} config.timestamps Whether or not to automatically add the attributes createdAt and updatedAt to every entry
     * @param {DefaultValues<T>} defaultValues Default values for omitted keys
     */
    private constructor(name: string, config: CollectionConfig, defaultValues?: DefaultValues<T>);

    #checkDefaultValues;
    #checkEntry;
    #checkFilter;
    #checkName;
    #fetchData;

    /**
     * Creates and pushes a new entry into the collection.
     * @param {Partial<T>} data Entry's data
     * @returns {T}
     */
    create(data: Partial<T>): T|never;

    /**
     * Creates and pushes more than one entry into the collection.
     * @param {Partial<T>[]} entries Entries' data
     * @returns {T[]}
     */
    createBulk(entries: Partial<T>[]): T[]|never;

    /**
     * Fetches the entries directly from the JSON file and returns the first one that matches the provided filter.
     * @param {Filter<T>} filter Filter to apply
     * @returns {T|null}
     */
    fetch(filter: Filter<T>): T|null|never;
    
    /**
     * Fetches all the entries from the collection directly from the JSON file.
     * @returns {T[]}
     */
    fetchAll(): T[]|never;

    /**
     * Fetches the entries directly from the JSON file and returns the ones that match the provided filter.
     * @param {Filter<T>} filter Filter to apply
     * @returns {T[]}
     */
    fetchMany(filter: Filter<T>): T[]|never;

    /**
     * Fetches the first entry that matches the provided filter directly from the JSON file.
     * If no entry is found, creates and pushes a new one with the provided data into the collection.
     * @param {Function} filter Filter to apply
     * @param {Partial<T>} data Entry's data
     * @returns {T|null}
     */
    fetchOrCreate(filter: Filter<T>, data: Partial<T>): T|null|never;

    /**
     * Returns the first entry that matches the provided filter.
     * @param {Filter<T>} filter Filter to apply
     * @returns {T|null}
     */
    get(filter: Filter<T>): T|null|never;
    
    /**
     * Returns all the entries from the collection.
     * @returns {T[]}
     */
    getAll(): T[]|never;

    /**
     * Returns the entries that match the provided filter.
     * @param {Filter<T>} filter Filter to apply
     * @returns {T[]}
     */
    getMany(filter: Filter<T>): T[]|never;

    /**
     * Returns the first entry that matches the provided filter.
     * If no entry is found, creates and pushes a new one with the provided data into the collection.
     * @param {Filter<T>} filter Filter to apply
     * @param {Partial<T>} data Entry's data
     * @returns {T|null}
     */
    getOrCreate(filter: Filter<T>, data: Partial<T>): T|null|never;

    /**
     * Checks if there is any entry matching the provided filter.
     * @param {Filter<T>} filter Filter to apply
     * @returns {boolean}
     */
    has(filter: Filter<T>): boolean|never;

    /**
     * Returns one ore more random entries from the collection.
     * @param {number} [amount] Number of entries to return
     * @returns {T|T[]}
     */
    random(amount?: number): T|T[]|never;

    /**
     * Removes the entries that match the provided filter.
     * Removes all the entries from the collection if no filter is provided.
     * @param {Filter<T>} [filter] Filter to apply
     * @returns {T[]}
     */
    remove(filter?: Filter<T>): T[]|never;

    /**
     * Resets the keys with default values from the entries that match the provided filter to their default values.
     * Resets the keys with default values from all the entries from the collection if no filter is provided.
     * @param {Filter<T>} [filter] Filter to apply
     * @returns {T[]}
     */
    reset(filter?: Filter<T>): T[]|never;

    /**
     * Writes the cached data into the collection's JSON file.
     */
    save(): void|never;

    /**
     * Updates the entries that match the provided filter with the provided callback.
     * Updates all the entries if no filter is provided.
     * @param {UpdateCallback<Writable<T>>} updateCallback Function to run for each entry returned by the filter
     * @param {Filter<T>} [filter] Filter to apply
     * @returns {T[]}
     */
    update(updateCallback: UpdateCallback<Writable<T>>, filter?: Filter<T>): T[]|never;
  }
}

export = SimplDB;