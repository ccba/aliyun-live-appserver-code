class DataStorage {
  constructor() {

    this.storage = new Map();
  }

  add(key, value) {
    this.storage.set(key, value);
  }

  remove(key, value) {
    this.storage.delete(key);
  }
  get(key) {
    return this.storage.get(key);
  }

  has(key) {
    return this.storage.has(key);
  }

  findByValue(fn) {
    let value = "";
    for (let val of this.storage.values()) {
      if (fn(val)) {
        value = val;
        break;
      }
    }
    return value;
  }
}

var storage = new DataStorage();

module.exports = storage;
