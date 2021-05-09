export interface DBConfig {
    filePath: string;
    saveOnUpdate: boolean;
    tabSize: number;
}
export declare class Config implements DBConfig {
    filePath: string;
    saveOnUpdate: boolean;
    tabSize: number;
    constructor(filePath: string, saveOnUpdate: boolean, tabSize: number);
    private validateFilePath;
}
