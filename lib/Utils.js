'use strict';

function isObject(obj) {
  const stringified = JSON.stringify(obj);
  return !!(stringified?.startsWith('{') && stringified?.endsWith('}'));
}

function isValidKey(key) {
  return typeof key === 'string' && key.split('.').every(k => k);
}

module.exports = { isObject, isValidKey };