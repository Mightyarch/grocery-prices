/**
 * Simple in-memory cache with TTL (Time To Live) and file persistence
 * This will help us minimize API calls to Spoonacular
 */
const fs = require("fs");
const path = require("path");

class SimpleCache {
  constructor(ttl = 86400000, filename = "price_cache.json") {
    // Default TTL: 24 hours
    this.cache = new Map();
    this.ttl = ttl;
    this.filename = path.join(__dirname, "..", "..", filename);
    this.loadFromFile();
  }

  set(key, value) {
    const item = {
      value,
      expiry: Date.now() + this.ttl,
    };
    this.cache.set(key, item);
    this.saveToFile();
    return value;
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      this.saveToFile();
      return null;
    }

    return item.value;
  }

  clear() {
    this.cache.clear();
    this.saveToFile();
  }

  // Save the cache to a file to persist between restarts
  saveToFile() {
    try {
      const cacheObj = {};
      this.cache.forEach((item, key) => {
        cacheObj[key] = item;
      });
      fs.writeFileSync(this.filename, JSON.stringify(cacheObj, null, 2));
    } catch (err) {
      console.error("Error saving cache to file:", err);
    }
  }

  // Load the cache from a file on startup
  loadFromFile() {
    try {
      if (fs.existsSync(this.filename)) {
        const data = fs.readFileSync(this.filename, "utf8");
        const cacheObj = JSON.parse(data);
        Object.keys(cacheObj).forEach((key) => {
          // Only load non-expired items
          if (Date.now() <= cacheObj[key].expiry) {
            this.cache.set(key, cacheObj[key]);
          }
        });
        console.log(
          `Loaded ${this.cache.size} cached items from ${this.filename}`
        );
      }
    } catch (err) {
      console.error("Error loading cache from file:", err);
      // Initialize an empty cache file if it doesn't exist or is invalid
      this.saveToFile();
    }
  }
}

const ingredientPriceCache = new SimpleCache();

module.exports = { ingredientPriceCache };
