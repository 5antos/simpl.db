"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimplDB = void 0;
const FS = __importStar(require("fs"));
const get_1 = __importDefault(require("lodash/get"));
const set_1 = __importDefault(require("lodash/set"));
const unset_1 = __importDefault(require("lodash/unset"));
class SimplDB {
    constructor(config) {
        this.data = {};
        this.validatePath(config.filePath);
        this.config = config;
        this.checkJSON();
        this.data = this.fetchData();
    }
    checkJSON() {
        if (!FS.readFileSync(this.config.filePath, 'utf8'))
            this.save();
    }
    validatePath(filePath) {
        try {
            FS.lstatSync(filePath);
        }
        catch (e) {
            if (e.code === 'ENOENT')
                throw new ReferenceError('Provided file does not exist.');
            else if (e.code === 'EACCES')
                throw new Error('Provided file cannot be accessed.');
        }
    }
    fetchData() {
        try {
            return JSON.parse(FS.readFileSync(this.config.filePath, 'utf8'));
        }
        catch (e) {
            throw e;
        }
    }
    addOrSubtract(operation, key, value) {
        let existentData = get_1.default(this.data, key);
        if (isNaN(value))
            throw new TypeError('The provided value is not a number.');
        else if (!!existentData && isNaN(existentData))
            throw new TypeError('The value from the provided key is not a number.');
        else if (!existentData)
            existentData = 0;
        set_1.default(this.data, key, operation === 'add' ? existentData + value : existentData - value);
        if (this.config.saveOnUpdate)
            this.save();
        return get_1.default(this.data, key);
    }
    /* Public methods */
    set(key, value) {
        set_1.default(this.data, key, value);
        if (this.config.saveOnUpdate)
            this.save();
        return get_1.default(this.data, key);
    }
    add(key, value) {
        return this.addOrSubtract('add', key, value);
    }
    subtract(key, value) {
        return this.addOrSubtract('subtract', key, value);
    }
    push(key, value) {
        let oldArray = get_1.default(this.data, key);
        if (!oldArray)
            oldArray = [];
        else if (!(oldArray instanceof Array))
            throw new TypeError('Provided key value is not an array.');
        oldArray.push(value);
        set_1.default(this.data, key, oldArray);
        if (this.config.saveOnUpdate)
            this.save();
        return get_1.default(this.data, key);
    }
    pull(key, value) {
        let oldArray = get_1.default(this.data, key);
        if (!(oldArray instanceof Array))
            throw new TypeError('Provided key value is not an array.');
        oldArray = oldArray.filter((v) => v !== value);
        set_1.default(this.data, key, oldArray);
        if (this.config.saveOnUpdate)
            this.save();
        return get_1.default(this.data, key);
    }
    get(key) {
        return get_1.default(this.data, key);
    }
    has(key) {
        return this.data.hasOwnProperty(key);
    }
    delete(key) {
        const deleted = unset_1.default(this.data, key);
        if (this.config.saveOnUpdate)
            this.save();
        return deleted;
    }
    clear() {
        this.data = {};
        if (this.config.saveOnUpdate)
            this.save();
    }
    toJSON() {
        try {
            return JSON.parse(JSON.stringify(this.data));
        }
        catch (e) {
            throw new TypeError('Provided argument is not a valid JSON object.');
        }
    }
    save() {
        try {
            FS.writeFileSync(this.config.filePath, JSON.stringify(this.data, null, this.config.tabSize));
        }
        catch (e) {
            throw e;
        }
    }
}
exports.SimplDB = SimplDB;
