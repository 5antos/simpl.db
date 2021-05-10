"use strict";

const Database = require("./lib/Database");

function SimplDB(config) {
  return new Database(config);
}

SimplDB.Database = Database

module.exports = SimplDB