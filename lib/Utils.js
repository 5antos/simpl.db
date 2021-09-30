'use strict';

function isObject(obj) {
  const stringified = JSON.stringify(obj);
  return !!(stringified?.startsWith('{') && stringified?.endsWith('}'));
}

function isValidKey(key) {
  return !(typeof key !== 'string' || !key || /(^\.)|(\.\.)|(\.$)/g.test(key));
}

module.exports = { isObject, isValidKey };