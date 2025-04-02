/**
 * Shopping Calculator Service
 * Calculates recipe costs based on actual retail packaging rather than exact amounts
 */
const axios = require("axios");
const { calculateIngredientCost } = require("./ingredientPriceService");
const { ingredientPriceCache } = require("../utils/cacheService");
const fs = require("fs");
const path = require("path");

// Spoonacular API configuration
const SPOONACULAR_API_KEY = process.env.SPOONACULAR_API_KEY;
const BASE_URL = "https://api.spoonacular.com";

// Cache for package sizes
class PackageSizeCache {
  constructor(ttl = 2592000000, filename = "package_size_cache.json") {
    // 30 days TTL
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

  // Save the cache to a file to persist between restarts
  saveToFile() {
    try {
      const cacheObj = {};
      this.cache.forEach((item, key) => {
        cacheObj[key] = item;
      });
      fs.writeFileSync(this.filename, JSON.stringify(cacheObj, null, 2));
    } catch (err) {
      console.error("Error saving package size cache to file:", err);
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
          `Loaded ${this.cache.size} package sizes from ${this.filename}`
        );
      }
    } catch (err) {
      console.error("Error loading package size cache from file:", err);
      // Initialize an empty cache file if it doesn't exist or is invalid
      this.saveToFile();
    }
  }
}

const packageSizeCache = new PackageSizeCache();

// Standard package sizes for common ingredients (these would ideally come from a database)
const PACKAGE_SIZES = {
  // Proteins
  "chicken breast": { size: "500g", price: 5.99 },
  "ground beef": { size: "500g", price: 4.99 },
  "salmon fillet": { size: "250g", price: 6.99 },
  tofu: { size: "400g", price: 2.49 },

  // Grains
  rice: { size: "1kg", price: 2.99 },
  pasta: { size: "500g", price: 1.99 },
  quinoa: { size: "500g", price: 4.99 },
  flour: { size: "1kg", price: 2.49 },
  cornflour: { size: "500g", price: 1.99 },

  // Oils & Sauces
  "olive oil": { size: "500ml", price: 6.99 },
  "vegetable oil": { size: "1L", price: 3.49 },
  "soy sauce": { size: "150ml", price: 2.79 },
  honey: { size: "340g", price: 4.99 },
  "sesame oil": { size: "250ml", price: 4.99 },
  "rice vinegar": { size: "150ml", price: 2.49 },

  // Spices & Herbs
  salt: { size: "750g", price: 1.29 },
  "black pepper": { size: "100g", price: 2.99 },
  "garlic powder": { size: "50g", price: 2.49 },
  ginger: { size: "100g", price: 1.99 },
  garlic: { size: "3 bulbs", price: 2.29 },
  "sesame seeds": { size: "100g", price: 2.79 },

  // Produce
  "bell pepper": { size: "3 pack", price: 2.99 },
  "spring onion": { size: "bunch", price: 1.29 },
  onion: { size: "3 pack", price: 1.99 },
  tomato: { size: "6 pack", price: 2.49 },
  lemon: { size: "3 pack", price: 2.49 },
};

/**
 * Parses quantity string to get numerical value and unit
 * @param {string} quantity - Quantity string (e.g., "150g", "2 tbsp", "3 pieces")
 * @returns {Object} - Parsed quantity object with value and unit
 */
function parseQuantity(quantity) {
  const match = quantity.match(/^([\d.]+)\s*(.+)$/);
  if (!match) return { value: 1, unit: quantity };

  return {
    value: parseFloat(match[1]),
    unit: match[2].trim(),
  };
}

/**
 * Converts between different units for the same ingredient
 * @param {number} value - Quantity value
 * @param {string} fromUnit - Source unit
 * @param {string} toUnit - Target unit
 * @param {string} ingredient - Ingredient name
 * @returns {number} - Converted value
 */
function convertUnit(value, fromUnit, toUnit, ingredient) {
  if (fromUnit === toUnit) return value;

  // Unit conversion map for common conversions
  const conversionMap = {
    // Weight conversions
    "g to kg": 0.001,
    "kg to g": 1000,

    // Volume conversions
    "ml to l": 0.001,
    "l to ml": 1000,
    "tbsp to ml": 15,
    "tsp to ml": 5,
    "cup to ml": 250,

    // Specific ingredient conversions
    "piece to g": {
      "chicken breast": 200,
      "bell pepper": 150,
      garlic: 5,
      lemon: 100,
      "spring onion": 30,
    },
    "bulb to g": {
      garlic: 45,
    },
  };

  // Handle weight conversions
  if (fromUnit === "g" && toUnit === "kg")
    return value * conversionMap["g to kg"];
  if (fromUnit === "kg" && toUnit === "g")
    return value * conversionMap["kg to g"];

  // Handle volume conversions
  if (fromUnit === "ml" && toUnit === "l")
    return value * conversionMap["ml to l"];
  if (fromUnit === "l" && toUnit === "ml")
    return value * conversionMap["l to ml"];
  if (fromUnit === "tbsp" && toUnit === "ml")
    return value * conversionMap["tbsp to ml"];
  if (fromUnit === "tsp" && toUnit === "ml")
    return value * conversionMap["tsp to ml"];
  if (fromUnit === "cup" && toUnit === "ml")
    return value * conversionMap["cup to ml"];

  // Handle specific ingredient conversions
  if (fromUnit === "piece" && (toUnit === "g" || toUnit === "kg")) {
    const gramsPerPiece = conversionMap["piece to g"][ingredient] || 100; // default to 100g if unknown
    return value * gramsPerPiece * (toUnit === "kg" ? 0.001 : 1);
  }

  if (fromUnit === "bulb" && (toUnit === "g" || toUnit === "kg")) {
    const gramsPerBulb = conversionMap["bulb to g"][ingredient] || 45; // default to 45g if unknown
    return value * gramsPerBulb * (toUnit === "kg" ? 0.001 : 1);
  }

  // Default: return original value if no conversion found
  console.warn(
    `No conversion found from ${fromUnit} to ${toUnit} for ${ingredient}`
  );
  return value;
}

/**
 * Fetches package information for an ingredient from Spoonacular API or estimates it
 * @param {string} ingredientName - Name of the ingredient to lookup
 * @returns {Promise<Object>} - Package information object with size and price
 */
async function getPackageInfo(ingredientName) {
  const normalizedName = ingredientName.toLowerCase().trim();

  // Check the hardcoded package sizes first
  if (PACKAGE_SIZES[normalizedName]) {
    return {
      ...PACKAGE_SIZES[normalizedName],
      source: "hardcoded database",
    };
  }

  // Check the cache second
  const cachedPackageInfo = packageSizeCache.get(normalizedName);
  if (cachedPackageInfo) {
    return {
      ...cachedPackageInfo,
      source: "package cache",
    };
  }

  try {
    // If we have a Spoonacular API key, try to fetch product information
    if (SPOONACULAR_API_KEY) {
      // First, get the price info from the ingredient price service
      const priceInfo = await ingredientPriceCache.get(normalizedName);

      if (!priceInfo || !priceInfo.price) {
        // If no price info, look up grocery products from Spoonacular
        const url = `${BASE_URL}/food/products/search?apiKey=${SPOONACULAR_API_KEY}&query=${encodeURIComponent(
          normalizedName
        )}&number=1`;
        const response = await axios.get(url);

        if (response.data.products && response.data.products.length > 0) {
          const product = response.data.products[0];

          // If we got a product, get its detailed information
          const productUrl = `${BASE_URL}/food/products/${product.id}?apiKey=${SPOONACULAR_API_KEY}`;
          const productResponse = await axios.get(productUrl);

          if (productResponse.data) {
            // Extract package size and price from the product
            const packageSize = extractPackageSizeFromProduct(
              productResponse.data
            );

            if (packageSize) {
              const packageInfo = {
                size: packageSize.size,
                price:
                  packageSize.price ||
                  (priceInfo ? priceInfo.price * 10 : 3.99), // Estimate package price
              };

              // Cache the package info
              packageSizeCache.set(normalizedName, packageInfo);

              return {
                ...packageInfo,
                source: "spoonacular API",
              };
            }
          }
        }
      }
    }

    // If we couldn't get package info from Spoonacular, estimate based on ingredient type
    const estimatedPackageInfo = estimatePackageInfo(normalizedName);
    packageSizeCache.set(normalizedName, estimatedPackageInfo);

    return {
      ...estimatedPackageInfo,
      source: "estimated",
    };
  } catch (error) {
    console.error(
      `Error fetching package info for ${normalizedName}:`,
      error.message
    );

    // Return an estimated package size on error
    const estimatedPackageInfo = estimatePackageInfo(normalizedName);
    return {
      ...estimatedPackageInfo,
      source: "estimated (after error)",
    };
  }
}

/**
 * Extracts package size information from a product response
 * @param {Object} product - Product object from Spoonacular API
 * @returns {Object|null} - Package size information or null if not found
 */
function extractPackageSizeFromProduct(product) {
  if (!product) return null;

  // Try to get package size from the product's package information
  if (product.packageWeight) {
    const weight = parseFloat(product.packageWeight.match(/[\d.]+/)?.[0] || 0);
    const unit = product.packageWeight.match(/[a-zA-Z]+/)?.[0] || "g";

    if (weight > 0) {
      return {
        size: `${weight}${unit}`,
        price: product.price || null,
      };
    }
  }

  // If no package weight, estimate from serving size
  if (product.servings && product.serving_size) {
    const servings = parseFloat(product.servings);
    const servingSize = parseFloat(
      product.serving_size.match(/[\d.]+/)?.[0] || 0
    );
    const unit = product.serving_size.match(/[a-zA-Z]+/)?.[0] || "g";

    if (servings > 0 && servingSize > 0) {
      const totalSize = servings * servingSize;
      return {
        size: `${totalSize}${unit}`,
        price: product.price || null,
      };
    }
  }

  return null;
}

/**
 * Estimates package information based on the type of ingredient
 * @param {string} ingredientName - Name of the ingredient
 * @returns {Object} - Estimated package information
 */
function estimatePackageInfo(ingredientName) {
  // Check for ingredient categories to make an educated guess
  const name = ingredientName.toLowerCase();

  // Proteins (typically come in smaller packages)
  if (
    name.includes("chicken") ||
    name.includes("beef") ||
    name.includes("fish") ||
    name.includes("pork") ||
    name.includes("tofu") ||
    name.includes("meat")
  ) {
    return { size: "500g", price: 5.99 };
  }

  // Grains and starches (typically larger packages)
  if (
    name.includes("rice") ||
    name.includes("pasta") ||
    name.includes("flour") ||
    name.includes("grain") ||
    name.includes("quinoa") ||
    name.includes("bean")
  ) {
    return { size: "1kg", price: 2.99 };
  }

  // Oils and liquids
  if (
    name.includes("oil") ||
    name.includes("sauce") ||
    name.includes("vinegar") ||
    name.includes("juice") ||
    name.includes("milk") ||
    name.includes("cream")
  ) {
    return { size: "500ml", price: 3.99 };
  }

  // Spices and herbs (small packages)
  if (
    name.includes("spice") ||
    name.includes("herb") ||
    name.includes("powder") ||
    name.includes("salt") ||
    name.includes("pepper") ||
    name.includes("seasoning")
  ) {
    return { size: "50g", price: 2.49 };
  }

  // Produce and vegetables
  if (
    name.includes("vegetable") ||
    name.includes("fruit") ||
    name.includes("onion") ||
    name.includes("pepper") ||
    name.includes("carrot") ||
    name.includes("tomato") ||
    name.includes("lettuce") ||
    name.includes("potato")
  ) {
    return { size: "500g", price: 2.49 };
  }

  // Default package size for unknown ingredients
  return { size: "250g", price: 3.49 };
}

/**
 * Calculates what percentage of a package is used for a recipe ingredient
 * @param {Object} ingredient - Ingredient object with name and quantity
 * @param {Object} packageInfo - Package information (size and price)
 * @returns {Object} - Calculation with percentage used and cost
 */
function calculatePackageUsage(ingredient, packageInfo) {
  const recipeQty = parseQuantity(ingredient.quantity);
  const packageQty = parseQuantity(packageInfo.size);

  // Extract unit type (weight, volume, count)
  const isRecipeWeight = recipeQty.unit.match(/g|kg|oz|lb/i);
  const isRecipeVolume = recipeQty.unit.match(/ml|l|tbsp|tsp|cup/i);
  const isRecipeCount = recipeQty.unit.match(/piece|unit|pack|bunch/i);

  const isPackageWeight = packageQty.unit.match(/g|kg|oz|lb/i);
  const isPackageVolume = packageQty.unit.match(/ml|l|tbsp|tsp|cup/i);
  const isPackageCount = packageQty.unit.match(/piece|unit|pack|bunch/i);

  let percentUsed = 0;

  // Handle weight to weight conversions
  if (isRecipeWeight && isPackageWeight) {
    // Convert both to grams for comparison
    const recipeGrams = convertUnit(
      recipeQty.value,
      recipeQty.unit,
      "g",
      ingredient.name
    );
    const packageGrams = convertUnit(
      packageQty.value,
      packageQty.unit,
      "g",
      ingredient.name
    );
    percentUsed = recipeGrams / packageGrams;
  }
  // Handle volume to volume conversions
  else if (isRecipeVolume && isPackageVolume) {
    // Convert both to ml for comparison
    const recipeMl = convertUnit(
      recipeQty.value,
      recipeQty.unit,
      "ml",
      ingredient.name
    );
    const packageMl = convertUnit(
      packageQty.value,
      packageQty.unit,
      "ml",
      ingredient.name
    );
    percentUsed = recipeMl / packageMl;
  }
  // Handle count to count conversions
  else if (isRecipeCount && isPackageCount) {
    percentUsed = recipeQty.value / packageQty.value;
  }
  // Handle cross conversions (using ingredient-specific conversion rates)
  else {
    if (isRecipeCount && isPackageWeight) {
      // Convert count to weight
      const recipeGrams = convertUnit(
        recipeQty.value,
        recipeQty.unit,
        "g",
        ingredient.name
      );
      const packageGrams = convertUnit(
        packageQty.value,
        packageQty.unit,
        "g",
        ingredient.name
      );
      percentUsed = recipeGrams / packageGrams;
    }
    // Other conversions would go here...
    else {
      console.warn(
        `Cannot convert between ${recipeQty.unit} and ${packageQty.unit} for ${ingredient.name}`
      );
      percentUsed = 0.5; // Default to 50% if can't determine
    }
  }

  return {
    percentUsed: Math.min(1, percentUsed), // Cap at 100%
    packagePrice: packageInfo.price,
    usedCost: packageInfo.price * Math.min(1, percentUsed),
    packageSize: packageInfo.size,
  };
}

/**
 * Calculates shopping costs for a recipe
 * @param {Array} ingredients - Array of ingredient objects
 * @returns {Promise<Object>} - Shopping costs calculation
 */
async function calculateShoppingCost(ingredients) {
  // First try to get API prices for comparison
  const apiCosts = await Promise.all(
    ingredients.map(async (ingredient) => {
      const apiCost = await calculateIngredientCost(ingredient);
      return {
        ...ingredient,
        apiCost: apiCost.total,
      };
    })
  );

  // Calculate costs based on package sizes
  const packageCosts = await Promise.all(
    apiCosts.map(async (ingredient) => {
      const packageInfo = await getPackageInfo(ingredient.name.toLowerCase());

      if (!packageInfo) {
        console.warn(`No package information for ${ingredient.name}`);
        return {
          ...ingredient,
          packageSize: "unknown",
          packagePrice: ingredient.apiCost || 0,
          percentUsed: 1,
          costInRecipe: ingredient.apiCost || 0,
          source: "api fallback",
        };
      }

      const calculation = calculatePackageUsage(ingredient, packageInfo);

      return {
        ...ingredient,
        packageSize: packageInfo.size,
        packagePrice: packageInfo.price,
        percentUsed: calculation.percentUsed,
        costInRecipe: calculation.usedCost,
        source: packageInfo.source || "package database",
      };
    })
  );

  // Calculate total costs
  const totalPackagePrice = packageCosts.reduce(
    (sum, item) => sum + item.packagePrice,
    0
  );
  const totalRecipeCost = packageCosts.reduce(
    (sum, item) => sum + item.costInRecipe,
    0
  );

  return {
    ingredients: packageCosts,
    totalPackagePrice, // Cost if buying all packages
    totalRecipeCost, // Cost of amounts used in recipe
    leftoverValue: totalPackagePrice - totalRecipeCost, // Value of leftover ingredients
  };
}

/**
 * Gets all available package information
 * @returns {Object} - Package information database including cached items
 */
function getAllPackageSizes() {
  // Combine hardcoded package sizes with any cached package sizes
  const allPackageSizes = { ...PACKAGE_SIZES };

  // Add items from the cache
  packageSizeCache.cache.forEach((item, key) => {
    if (!allPackageSizes[key]) {
      allPackageSizes[key] = {
        ...item.value,
        source: "package cache",
      };
    }
  });

  return allPackageSizes;
}

module.exports = {
  calculateShoppingCost,
  PACKAGE_SIZES,
  getAllPackageSizes,
  getPackageInfo,
};
