/**
 * License Verification API
 * Express.js REST API for verifying driver's licenses against a MySQL database
 */

const express = require("express");
const mysql = require("mysql2/promise");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const app = express();

// Middleware
app.use(express.json());

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: "require",
  ca: fs.readFileSync(path.join(__dirname, process.env.DB_SSL_CA)),
};

const DB_TABLE = process.env.DB_TABLE || "licenses";

/**
 * Create a database connection pool
 */
const pool = mysql.createPool(dbConfig);

/**
 * Verify license data structure and format
 */
function validateLicenseData(licenseData) {
  const requiredFields = ["LicenseNumber", "Name", "DOB", "ExpiryDate"];

  for (const field of requiredFields) {
    if (!licenseData[field] || licenseData[field].trim() === "") {
      return { valid: false, error: `Missing or empty field: ${field}` };
    }
  }

  return { valid: true };
}

/**
 * Parse and validate expiry date (DD/MM/YYYY format)
 */
function parseExpiryDate(dateStr) {
  const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
  const match = dateStr.trim().match(dateRegex);

  if (!match) {
    return {
      valid: false,
      error: `Invalid expiry date format. Expected DD/MM/YYYY, got: ${dateStr}`,
    };
  }

  const [, day, month, year] = match;
  const date = new Date(year, month - 1, day);

  if (
    date.getDate() !== parseInt(day) ||
    date.getMonth() !== parseInt(month) - 1
  ) {
    return { valid: false, error: `Invalid date values: ${dateStr}` };
  }

  return { valid: true, date };
}

/**
 * Check if license is expired
 */
function isLicenseExpired(expiryDate) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return expiryDate < today;
}

/**
 * Verify license from database
 */
async function verifyLicenseFromDB(licenseData) {
  try {
    // Validate input structure
    const validation = validateLicenseData(licenseData);
    if (!validation.valid) {
      return {
        success: false,
        message: validation.error,
        license_valid: false,
        is_expired: null,
      };
    }

    // Parse and validate expiry date
    const expiryParsed = parseExpiryDate(licenseData.ExpiryDate);
    if (!expiryParsed.valid) {
      return {
        success: false,
        message: expiryParsed.error,
        license_valid: false,
        is_expired: null,
      };
    }

    const expiryDate = expiryParsed.date;
    const expired = isLicenseExpired(expiryDate);

    // Query database
    const connection = await pool.getConnection();

    const query = `
      SELECT LicenseNumber, Name, DOB, ExpiryDate 
      FROM ${DB_TABLE} 
      WHERE LicenseNumber = ?
    `;

    const [rows] = await connection.execute(query, [licenseData.LicenseNumber]);
    connection.release();

    // License not found
    if (rows.length === 0) {
      return {
        success: false,
        message: `License not found in database: ${licenseData.LicenseNumber}`,
        license_valid: false,
        is_expired: expired,
      };
    }

    const dbLicense = rows[0];

    // Verify license details match
    if (
      dbLicense.Name.trim().toLowerCase() !==
        licenseData.Name.trim().toLowerCase() ||
      dbLicense.DOB.trim() !== licenseData.DOB.trim()
    ) {
      return {
        success: false,
        message: "License details do not match database records",
        license_valid: false,
        is_expired: expired,
      };
    }

    // Check if expired
    if (expired) {
      return {
        success: false,
        message: `License expired on ${expiryDate.toLocaleDateString("en-GB")}`,
        license_valid: true,
        is_expired: true,
      };
    }

    // License is valid and not expired
    return {
      success: true,
      message: "License verified successfully",
      license_valid: true,
      is_expired: false,
    };
  } catch (error) {
    console.error("❌ Database Error:", error);
    return {
      success: false,
      message: `Database error: ${error.message}`,
      license_valid: false,
      is_expired: null,
    };
  }
}

/**
 * POST /verify-license
 * Verify a driver's license
 */
app.post("/verify-license", async (req, res) => {
  try {
    if (!req.body || typeof req.body !== "object") {
      return res.status(400).json({
        success: false,
        message: "Invalid request format",
        license_valid: false,
        is_expired: null,
      });
    }

    const result = await verifyLicenseFromDB(req.body);
    const statusCode = result.success ? 200 : 400;
    return res.status(statusCode).json(result);
  } catch (error) {
    console.error("❌ API Error:", error);
    return res.status(500).json({
      success: false,
      message: `API error: ${error.message}`,
      license_valid: false,
      is_expired: null,
    });
  }
});

/**
 * GET /health
 * Health check endpoint
 */
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "License Verification API is running",
  });
});

/**
 * GET /
 * API documentation endpoint
 */
app.get("/", (req, res) => {
  res.status(200).json({
    name: "License Verification API",
    version: "1.0.0",
    endpoints: {
      "POST /verify-license": "Verify a driver's license",
      "GET /health": "Health check",
      "GET /": "API documentation",
    },
  });
});

/**
 * Error handling middleware
 */
app.use((err, req, res, next) => {
  console.error("❌ Unhandled Error:", err);
  res.status(500).json({
    success: false,
    message: "Internal server error",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

/**
 * 404 handler
 */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Endpoint not found",
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(
    `🚀 License Verification API is running on http://localhost:${PORT}`,
  );
  console.log(`📚 API Documentation: http://localhost:${PORT}/`);
});

module.exports = app;
