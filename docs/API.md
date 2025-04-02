# API Documentation

This document provides detailed information about all API endpoints in the Grocery Prices API.

## Base URL

```
http://localhost:3000/api
```

## Authentication

Currently, the API does not require authentication for requests.

## API Endpoints

### Ingredient Prices

#### Get Ingredient Price

```
GET /ingredients/price/:name
```

Retrieve price information for a single ingredient.

**Parameters:**

| Name | Type   | In   | Description                           |
| ---- | ------ | ---- | ------------------------------------- |
| name | string | path | The name of the ingredient to look up |

**Response:**

Status: 200 OK

```json
{
  "price": 2.0039,
  "unit": "piece",
  "source": "spoonacular"
}
```

Status: 404 Not Found

```json
{
  "message": "No price data found for ingredient: ingredient_name",
  "source": "spoonacular"
}
```

#### Calculate Ingredient Cost

```
POST /ingredients/calculate
```

Calculate the cost of an ingredient based on its quantity.

**Request Body:**

```json
{
  "name": "chicken breast",
  "quantity": "500g"
}
```

**Response:**

Status: 200 OK

```json
{
  "name": "chicken breast",
  "quantity": "500g",
  "price": 2.0039,
  "priceUnit": "piece",
  "total": 6.01,
  "source": "spoonacular"
}
```

### Recipe Costs

#### Calculate Recipe Cost

```
POST /ingredients/recipe
```

Calculate the total cost for a recipe with multiple ingredients.

**Request Body:**

```json
{
  "ingredients": [
    { "name": "chicken breast", "quantity": "500g" },
    { "name": "olive oil", "quantity": "2 tbsp" },
    { "name": "salt", "quantity": "1 tsp" }
  ]
}
```

**Response:**

Status: 200 OK

```json
{
  "ingredients": [
    {
      "name": "chicken breast",
      "quantity": "500g",
      "price": 2.0039,
      "priceUnit": "piece",
      "total": 6.01,
      "source": "spoonacular"
    },
    {
      "name": "olive oil",
      "quantity": "2 tbsp",
      "price": 0.0241,
      "priceUnit": "piece",
      "total": 0.07,
      "source": "spoonacular"
    },
    {
      "name": "salt",
      "quantity": "1 tsp",
      "price": 0,
      "priceUnit": "piece",
      "total": 0,
      "source": "spoonacular"
    }
  ],
  "totalCost": 6.08
}
```

#### Get Recipe Price Breakdown by ID

```
GET /ingredients/recipe/:id/price
```

Get a detailed price breakdown for a recipe by its Spoonacular ID.

**Parameters:**

| Name | Type   | In   | Description           |
| ---- | ------ | ---- | --------------------- |
| id   | number | path | Spoonacular recipe ID |

**Response:**

Status: 200 OK

```json
{
  "ingredients": [
    {
      "name": "chicken breast",
      "price": 602,
      "amount": {
        "metric": {
          "value": 500,
          "unit": "g"
        },
        "us": {
          "value": 17.637,
          "unit": "oz"
        }
      }
    }
    // More ingredients...
  ],
  "totalCost": 782,
  "totalCostPerServing": 261
}
```

### Shopping Calculator

#### Calculate Shopping Cost

```
POST /ingredients/shopping-cost
```

Calculate shopping cost based on retail packaging sizes.

**Request Body:**

```json
{
  "ingredients": [
    { "name": "chicken breast", "quantity": "500g" },
    { "name": "olive oil", "quantity": "2 tbsp" },
    { "name": "asparagus", "quantity": "250g" },
    { "name": "quinoa", "quantity": "200g" }
  ]
}
```

**Response:**

Status: 200 OK

```json
{
  "ingredients": [
    {
      "name": "chicken breast",
      "quantity": "500g",
      "apiCost": 6.01,
      "packageSize": "500g",
      "packagePrice": 5.99,
      "percentUsed": 1,
      "costInRecipe": 5.99,
      "source": "hardcoded database"
    }
    // More ingredients...
  ],
  "totalPackagePrice": 21.46,
  "totalRecipeCost": 11.91,
  "leftoverValue": 9.55
}
```

#### Get Package Sizes

```
GET /ingredients/package-sizes
```

Get all available standard package sizes for ingredients.

**Response:**

Status: 200 OK

```json
{
  "chicken breast": {
    "size": "500g",
    "price": 5.99
  },
  "ground beef": {
    "size": "500g",
    "price": 4.99
  }
  // More ingredients...
}
```

#### Get Package Information

```
GET /ingredients/package-info/:name
```

Get package information for a specific ingredient.

**Parameters:**

| Name | Type   | In   | Description                           |
| ---- | ------ | ---- | ------------------------------------- |
| name | string | path | The name of the ingredient to look up |

**Response:**

Status: 200 OK

```json
{
  "size": "500g",
  "price": 5.99,
  "source": "hardcoded database"
}
```

Status: 404 Not Found

```json
{
  "message": "No package information found for ingredient: ingredient_name"
}
```

## Error Handling

The API returns appropriate HTTP status codes along with error messages:

- **400 Bad Request**: When the request is malformed or missing required fields
- **404 Not Found**: When the requested resource is not found
- **500 Internal Server Error**: When an unexpected error occurs

**Error Response Format:**

```json
{
  "message": "Error message describing what went wrong"
}
```

## Rate Limiting

The API does not implement rate limiting, but as it relies on the Spoonacular API for some data, you should be aware of Spoonacular's rate limits if you're making many requests.

## Data Sources

The API combines data from multiple sources:

1. **Spoonacular API**: For basic ingredient price data
2. **Hardcoded Database**: For common package sizes
3. **Package Size Cache**: For previously looked-up ingredients
4. **Intelligent Estimation**: For unknown ingredients
