# License Verification API

An Express.js REST API that verifies driver's licenses against a MySQL database.

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

The `.env` file is already configured with the database credentials:

- Host: `mysqldb-striverdileep-df7e.d.aivencloud.com`
- Port: `25359`
- User: `avnadmin`
- Database: `defaultdb`
- SSL: Required (CA certificate included in `ca.pem`)

### 3. Database Prerequisites

Ensure the database has a `licenses` table with the following columns:

- `LicenseNumber` (VARCHAR or TEXT) - Primary identifier
- `Name` (VARCHAR or TEXT)
- `DOB` (VARCHAR or TEXT in DD/MM/YYYY format)
- `ExpiryDate` (VARCHAR or TEXT in DD/MM/YYYY format)

### 4. Run the API

**Production:**

```bash
npm start
```

**Development (with auto-reload):**

```bash
npm run dev
```

The API will start on `http://localhost:5000`

## API Endpoints

### POST /verify-license

Verifies a driver's license against the database.

#### Request Input Parameters

| Parameter     | Type   | Required | Format     | Description                                |
| ------------- | ------ | -------- | ---------- | ------------------------------------------ |
| LicenseNumber | String | Yes      | Text       | Unique identifier for the driver's license |
| Name          | String | Yes      | Text       | Full name of the license holder            |
| DOB           | String | Yes      | DD/MM/YYYY | Date of birth                              |
| ExpiryDate    | String | Yes      | DD/MM/YYYY | License expiry date                        |

#### Response Output

| Field         | Type    | Description                                               |
| ------------- | ------- | --------------------------------------------------------- |
| success       | Boolean | True if verification passed, false otherwise              |
| message       | String  | Descriptive message about the verification result         |
| license_valid | Boolean | True if license details are valid and found in database   |
| is_expired    | Boolean | True if license has expired (null if unable to determine) |

**Request:**

```json
{
  "LicenseNumber": "DL001",
  "Name": "John Doe",
  "DOB": "15/03/1990",
  "ExpiryDate": "14/03/2030"
}
```

**Response (Success - Not Expired):**

```json
{
  "success": true,
  "message": "License verified successfully",
  "license_valid": true,
  "is_expired": false
}
```

**Response (Expired):**

```json
{
  "success": false,
  "message": "License expired on 14/03/2025",
  "license_valid": true,
  "is_expired": true
}
```

**Response (Not Found):**

```json
{
  "success": false,
  "message": "License not found in database: DL001",
  "license_valid": false,
  "is_expired": false
}
```

**Response (Details Don't Match):**

```json
{
  "success": false,
  "message": "License details do not match database records",
  "license_valid": false,
  "is_expired": false
}
```

### GET /health

Health check endpoint.

**Response:**

```json
{
  "status": "OK",
  "message": "License Verification API is running"
}
```

### GET /

API documentation endpoint.

**Response:**

```json
{
  "name": "License Verification API",
  "version": "1.0.0",
  "endpoints": {
    "POST /verify-license": "Verify a driver's license",
    "GET /health": "Health check",
    "GET /": "API documentation"
  }
}
```

## Testing

### Using cURL

```bash
curl -X POST http://localhost:5000/verify-license \
  -H "Content-Type: application/json" \
  -d '{
    "LicenseNumber": "DL001",
    "Name": "John Doe",
    "DOB": "15/03/1990",
    "ExpiryDate": "14/03/2030"
  }'
```

### Using Postman

1. Create a new POST request to `http://localhost:5000/verify-license`
2. Set header: `Content-Type: application/json`
3. Add request body (JSON)
4. Send request

### Using Node.js/JavaScript

```javascript
const axios = require("axios");

const licenseData = {
  LicenseNumber: "DL001",
  Name: "John Doe",
  DOB: "15/03/1990",
  ExpiryDate: "14/03/2030",
};

axios
  .post("http://localhost:5000/verify-license", licenseData)
  .then((response) => console.log(response.data))
  .catch((error) => console.error(error.response.data));
```

### Using Python

```python
import requests

license_data = {
    "LicenseNumber": "DL001",
    "Name": "John Doe",
    "DOB": "15/03/1990",
    "ExpiryDate": "14/03/2030"
}

response = requests.post(
    'http://localhost:5000/verify-license',
    json=license_data
)
print(response.json())
```

## Features

- ✅ Express.js REST API
- ✅ Connects to remote MySQL database with SSL
- ✅ Verifies license data against database records
- ✅ Checks license expiry date (DD/MM/YYYY format)
- ✅ Returns detailed verification status
- ✅ Error handling and input validation
- ✅ Health check endpoint
- ✅ Environment variable configuration (.env)
- ✅ Connection pooling for better performance

## Project Structure

```
LicenseVerificationAPI/
├── app.js                 # Main Express.js application
├── .env                   # Environment variables (database credentials)
├── ca.pem                 # SSL certificate for database connection
├── package.json           # Node.js dependencies and scripts
└── README.md              # This file
```

## Notes

- All dates must be in `DD/MM/YYYY` format
- License names are compared case-insensitively
- SSL certificate (`ca.pem`) is required for secure database connection
- The API uses connection pooling for efficient database access
- Response status codes: 200 (success), 400 (validation error), 500 (server error)

## Troubleshooting

**Database Connection Error:**

- Verify `.env` file has correct credentials
- Check if `ca.pem` file exists in the project root
- Ensure database host is accessible from your network

**Certificate Error:**

- Make sure `ca.pem` is in the root directory
- Path in `.env` should be `./ca.pem`

**Port Already in Use:**

- Change PORT in `.env` or pass it as environment variable: `PORT=3000 npm start`
