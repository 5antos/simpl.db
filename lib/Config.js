"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Config = void 0;
const fs_1 = require("fs");
const path_1 = require("path");
class Config {
    constructor(filePath, saveOnUpdate, tabSize) {
        this.validateFilePath(filePath);
        this.filePath = filePath;
        this.saveOnUpdate = saveOnUpdate || true;
        this.tabSize = tabSize || 4;
    }
    validateFilePath(path) {
        if (!path || !path.length)
            throw new Error('Missing file path argument.');
        else if (!fs_1.lstatSync(path).isFile() || path_1.extname(path) !== '.json')
            throw new Error('Invalid file path argument. Provided path should lead to a .json file.');
    }
}
exports.Config = Config;
