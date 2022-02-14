declare function SimplDB(config?: SimplDB.DBConfig): SimplDB.Database;

declare namespace SimplDB {
  export type DBConfig = {
    autoSave?: boolean;
    collectionsFolder?: string;
    dataFile?: string;
    encryptionKey?: string;
    tabSize?: number;
  }
  
  export type CollectionConfig = {
    autoSave?: boolean;
    folderPath?: string;
    tabSize?: number;
  }
  
  export type JSONData = string | number | Data | JSONData[] | boolean | null;

  export type Incrementable<T> = {
    [Prop in keyof T]: T[Prop] extends number ? Prop : never
  }[keyof T]

  export type Extended<T> = {
    [Prop in keyof T as `$${Prop}`]: T[Prop]
  }

  export type DefaultValues<T> = Pick<T, Incrementable<Extended<T>>> | Partial<T>;

  export type Filter<T extends any[]> = (args: T) => boolean;

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
     * @param {string} [config.dataFile] The path of the JSON file (from the root of the project) to store data in
     * @param {boolean} [config.autoSave] Whether or not to write new data to the JSON file everytime it is updated
     * @param {string} [config.collectionsFolder] The path to a folder where collections' data will be stored
     * @param {string} [config.encryptionKey] The Encryption Key to be used when encrypting and decrypting data
     * @param {number} [config.tabSize] The size of the tab in the JSON file (indentation)
     */
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

    /**
     * Adds the provided value to the value of the provided key.
     * If no existing number, the provided value will be added to 0 (zero).
     * @param {string} key The key that will have its value incremented
     * @param {number} value The value to increment
     * @returns {number|Data}
     */
    add(key: string, value: number): number|Data|never;

    /**
     * Clears the database.
     */
    clear(): void;

    /**
     * Creates a new collection.
     * @param {string} name The name for the collection
     * @param {DefaultValues<T>} [defaultValues={}] Default values for omitted keys
     * @returns {Collection<T>}
     */
    createCollection<T>(name: string, defaultValues?: DefaultValues<T>): Collection<T>|never;

    /**
     * Deletes a key.
     * Returns a boolean based on whether the key was successfully deleted or not.
     * @param {string} key The key to delete
     * @returns {boolean}
     */
    delete(key: string): boolean|never;

    /**
     * Deletes a collection.
     * Returns true if the collection is successfully deleted and false otherwise.
     * @param {string} name The name of the collection
     * @returns {boolean}
     */
    deleteCollection(name: string): boolean|never;

    /**
     * Fetches the data directly from the JSON file and returns the value of the provided key.
     * @param {string} key The key to get the value from
     * @returns {JSONData}
     */
    fetch(key: string): JSONData|never;

    /**
     * Returns the value of the provided key.
     * @param {string} key The key to get the value from
     * @param {boolean} [decrypt=false] Whether or not to decrypt the returned value. Defaults to false
     * @returns {JSONData}
     */
    get(key: string, decrypt?: boolean): JSONData|never;

    /**
     * Returns a boolean based on whether an element or property exists or not.
     * @param {string} key The key that will be checked
     * @returns {boolean}
     */
    has(key: string): boolean|never;

    /**
     * Removes all the elements with the same value as the provided value from an array based on the provided key.
     * @param {string} key The key of the target array
     * @param {JSONData} value The value to remove from the array
     * @returns {JSONData|never}
     */
    pull(key: string, value: JSONData): JSONData|never;

    /**
     * Pushes an element into an array based on the provided key.
     * @param {string} key The key of the target array
     * @param {JSONData} value The value to push into the array
     * @returns {JSONData|never}
     */
    push(key: string, value: JSONData): JSONData|never;

    /**
     * Writes the cached data into the JSON file.
     */
    save(): void|never;

    /**
     * Sets a new value to the value of the provided key.
     * @param {string} key The target key
     * @param {JSONData} value The value to set
     * @param {boolean} [encrypt=false] Whether or not to encrypt the value before setting it. Defaults to false
     * @returns {JSONData|Data}
     */
    set(key: string, value: JSONData, encrypt?: boolean): JSONData|Data|never;

    /**
     * Subtracts the provided value from the value of the provided key.
     * If no existing number, the provided value will be subtracted from 0 (zero).
     * @param {string} key The key that will have its value decremented
     * @param {number} value The value to decrement
     * @returns {number|JSONData}
     */
    subtract(key: string, value: number): number|JSONData|never;

    /**
     * Parses and returns all the data from the database as an object.
     * @returns {Data}
     */
    toJSON(): Data;
  }
  
  
  /**
   * Collection where data is stored separately from the main data, in a different file.
   */
  export class Collection<T> {
    #config: CollectionConfig;
    #data: T[];
    #defaultValues: DefaultValues<T>;
    
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
     * @param {CollectionConfig} config The configuration to use in the collection
     * @param {boolean} [config.autoSave] Whether or not to write data into the JSON file everytime it is updated
     * @param {string} [config.folderPath] The path where the collection's data will be stored
     * @param {string} [config.tabSize] The size of the tab in the JSON file (indentation)
     * @param {string} name The name of the collection
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
     * Fetches the data directly from the JSON file and returns the one that matches the provided filter.
     * Fetches and returns all the data from the collection if no filter is provided.
     * @param {Filter<T>} [filter] Filter to apply
     * @returns {T|T[]}
     */
    fetch(filter?: Filter<T>): T|T[]|never;

    /**
     * Fetches the data directly from the JSON file or, if no data is found, creates and pushes a new entry into the collection with the provided data.
     * @param {Function} filter Filter to apply
     * @param {Data} data Entry's data
     * @returns {Data|Data[]}
     */
    fetchOrCreate(filter: Filter<T>, data: T): T|T[]|never;

    /**
     * Returns the data that matches the provided filter.
     * Returns all the data from the collection if no filter is provided.
     * @param {Filter<T>} [filter] Filter to apply
     * @returns {T|T[]}
     */
    get(filter?: Filter<T>): T|T[]|never;

    /**
     * Returns the data that matches the provided filter or, if no data is found, creates and pushes a new entry into the collection with the provided data.
     * @param {Filter<T>} filter Filter to apply
     * @param {Partial<T>} data Entry's data
     * @returns {T|T[]}
     */
    getOrCreate(filter: Filter<T>, data: Partial<T>): T|T[]|never;

    /**
     * Checks if there is any data matching the provided filter.
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
     * Removes the data that matches the provided filter.
     * Removes all the data from the collection if no filter is provided.
     * @param {Filter<T>} [filter] Filter to apply. If this parameter is not provided, all data from the collection will be removed
     * @returns {T[]}
     */
    remove(filter?: Filter<T>): T[]|never;

    /**
     * Writes the cached data into the collection's JSON file.
     */
    save(): void|never;

    /**
     * Updates the data from the collection that matches the provided filter with the callback.
     * Updates all the data from the collection if no filter is provided.
     * @param {UpdateCallback<T>} updateCallback Function to run for each entry returned by the filter
     * @param {Filter<T>} [filter] Filter to apply. If this parameter is not provided, all data from the collection will be updated
     * @returns {T[]}
     */
    update(updateCallback: UpdateCallback<T>, filter?: Filter<T>): T[]|never;
  }
}

export = SimplDB;