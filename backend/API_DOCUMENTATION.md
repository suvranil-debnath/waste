# Smart Waste Management API Documentation

Complete API reference for the Smart Waste Management Backend System.

**Production URL**: `https://waste-dcdi.onrender.com`  
**Production API**: `https://waste-dcdi.onrender.com/api`

**Local Development**: `http://localhost:5000/api`

---

## Table of Contents

1. [Authentication](#authentication)
2. [Municipality (GP Admin) APIs](#municipality-gp-admin-apis)
3. [Block Admin APIs](#block-admin-apis)
4. [Collection Agent APIs](#collection-agent-apis)
5. [Error Responses](#error-responses)
6. [Test User Accounts](#test-user-accounts)

---

## Authentication

All protected routes require JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

### 1. Login

**Endpoint**: `POST /api/auth/login`

**Description**: Authenticate user and receive JWT token

**Request Body**:
```json
{
  "email": "string (required)",
  "password": "string (required, min 6 chars)",
  "role": "STATE_ADMIN | DISTRICT_ADMIN | BLOCK_ADMIN | GP_ADMIN | COLLECTION_AGENT (required)"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
      "email": "gpbn-gp1@admin.com",
      "name": "Block North - GP 1 Administrator",
      "role": "GP_ADMIN",
      "gpId": "65a1b2c3d4e5f6g7h8i9j0k2",
      "blockId": "65a1b2c3d4e5f6g7h8i9j0k3",
      "districtId": "65a1b2c3d4e5f6g7h8i9j0k4",
      "stateId": "65a1b2c3d4e5f6g7h8i9j0k5",
      "isActive": true,
      "createdAt": "2024-12-29T16:30:00.000Z"
    }
  }
}
```

**cURL Example**:
```bash
# Login as GP Admin
curl -X POST https://waste-dcdi.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "gpbn-gp1@admin.com",
    "password": "admin123",
    "role": "GP_ADMIN"
  }'

# Login as Collection Agent
curl -X POST https://waste-dcdi.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "agent1@waste.com",
    "password": "agent123",
    "role": "COLLECTION_AGENT"
  }'

# Login as Block Admin
curl -X POST https://waste-dcdi.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "blockbn@admin.com",
    "password": "admin123",
    "role": "BLOCK_ADMIN"
  }'
```

---

### 2. Get Session

**Endpoint**: `GET /api/auth/session`

**Description**: Get current user session information

**Headers**: 
```
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
      "email": "gpbn-gp1@admin.com",
      "name": "Block North - GP 1 Administrator",
      "role": "GP_ADMIN",
      "gpId": {
        "_id": "65a1b2c3d4e5f6g7h8i9j0k2",
        "name": "Block North - GP 1",
        "code": "BN-GP1"
      },
      "isActive": true
    }
  }
}
```

**cURL Example**:
```bash
curl https://waste-dcdi.onrender.com/api/auth/session \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

### 3. Logout

**Endpoint**: `POST /api/auth/logout`

**Description**: Logout user (client-side token removal)

**Headers**: 
```
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Logout successful"
}
```

**cURL Example**:
```bash
curl -X POST https://waste-dcdi.onrender.com/api/auth/logout \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## Municipality (GP Admin) APIs

All endpoints require `GP_ADMIN` role.

### 1. Get Dashboard Statistics

**Endpoint**: `GET /api/municipality/dashboard`

**Description**: Get comprehensive dashboard statistics for the GP

**Headers**: 
```
Authorization: Bearer <gp_admin_token>
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "houses": {
      "total": 0,
      "activeGPS": 0,
      "pendingGPS": 0,
      "totalMembers": 0
    },
    "staff": {
      "total": 4,
      "presentToday": 0
    },
    "vans": {
      "total": 2
    },
    "wasteToday": {
      "totalCollections": 0,
      "totalWaste": 0,
      "solidWaste": 0,
      "plasticWaste": 0,
      "organicWaste": 0,
      "eWaste": 0
    }
  }
}
```

**cURL Example**:
```bash
curl https://waste-dcdi.onrender.com/api/municipality/dashboard \
  -H "Authorization: Bearer YOUR_GP_ADMIN_TOKEN"
```

---

### 2. Get Zones

**Endpoint**: `GET /api/municipality/zones`

**Description**: Get all zones in the municipality/GP

**Headers**: 
```
Authorization: Bearer <gp_admin_token>
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
      "name": "Block North - GP 1 - Zone A",
      "code": "BN-GP1-ZA",
      "gpId": "65a1b2c3d4e5f6g7h8i9j0k2",
      "area": 10.5,
      "isActive": true,
      "totalHouses": 0,
      "createdAt": "2024-12-29T16:30:00.000Z"
    }
  ]
}
```

**cURL Example**:
```bash
curl https://waste-dcdi.onrender.com/api/municipality/zones \
  -H "Authorization: Bearer YOUR_GP_ADMIN_TOKEN"
```

---

### 3. Get Houses

**Endpoint**: `GET /api/municipality/houses`

**Description**: Get all houses in the municipality/GP

**Headers**: 
```
Authorization: Bearer <gp_admin_token>
```

**Query Parameters**:
- `zoneId` (optional): Filter by zone ID
- `gpsStatus` (optional): Filter by GPS status ("Active" or "Pending")

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
      "houseNumber": "H-001",
      "ownerName": "Rajesh Kumar",
      "address": "123 Main Street",
      "gpId": "65a1b2c3d4e5f6g7h8i9j0k2",
      "zoneId": {
        "_id": "65a1b2c3d4e5f6g7h8i9j0k3",
        "name": "Block North - GP 1 - Zone A"
      },
      "qrCode": "HOUSE:65a1b2c3d4e5f6g7h8i9j0k1:H-001:65a1b2c3d4e5f6g7h8i9j0k2:uuid-here",
      "latitude": null,
      "longitude": null,
      "isGPSActive": false,
      "totalMembers": 4,
      "assignedVanId": "65a1b2c3d4e5f6g7h8i9j0k4",
      "isActive": true,
      "createdAt": "2024-12-29T16:30:00.000Z"
    }
  ]
}
```

**cURL Examples**:
```bash
# Get all houses
curl https://waste-dcdi.onrender.com/api/municipality/houses \
  -H "Authorization: Bearer YOUR_GP_ADMIN_TOKEN"

# Filter by zone
curl "https://waste-dcdi.onrender.com/api/municipality/houses?zoneId=65a1b2c3d4e5f6g7h8i9j0k3" \
  -H "Authorization: Bearer YOUR_GP_ADMIN_TOKEN"

# Filter by GPS status
curl "https://waste-dcdi.onrender.com/api/municipality/houses?gpsStatus=Active" \
  -H "Authorization: Bearer YOUR_GP_ADMIN_TOKEN"

curl "https://waste-dcdi.onrender.com/api/municipality/houses?gpsStatus=Pending" \
  -H "Authorization: Bearer YOUR_GP_ADMIN_TOKEN"
```

---

### 4. Create House

**Endpoint**: `POST /api/municipality/houses`

**Description**: Create a new house with QR code generation

**Headers**: 
```
Authorization: Bearer <gp_admin_token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "houseNumber": "H-001",
  "ownerName": "Rajesh Kumar",
  "address": "123 Main Street",
  "zoneId": "65a1b2c3d4e5f6g7h8i9j0k1",
  "totalMembers": 4
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "message": "House created successfully",
  "data": {
    "house": {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
      "houseNumber": "H-001",
      "ownerName": "Rajesh Kumar",
      "address": "123 Main Street",
      "qrCode": "HOUSE:65a1b2c3d4e5f6g7h8i9j0k1:H-001:65a1b2c3d4e5f6g7h8i9j0k2:uuid-here",
      "latitude": null,
      "longitude": null,
      "isGPSActive": false,
      "totalMembers": 4
    },
    "qrCodeImage": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
  }
}
```

**cURL Example**:
```bash
curl -X POST https://waste-dcdi.onrender.com/api/municipality/houses \
  -H "Authorization: Bearer YOUR_GP_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "houseNumber": "H-001",
    "ownerName": "Rajesh Kumar",
    "address": "123 Main Street, Kolkata",
    "zoneId": "ZONE_ID_FROM_ZONES_API",
    "totalMembers": 4
  }'
```

---

### 5. Update House

**Endpoint**: `PUT /api/municipality/houses/:id`

**Description**: Update house details

**Headers**: 
```
Authorization: Bearer <gp_admin_token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "ownerName": "Updated Owner Name",
  "address": "Updated Address",
  "totalMembers": 5
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "House updated successfully",
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "houseNumber": "H-001",
    "ownerName": "Updated Owner Name",
    "address": "Updated Address",
    "totalMembers": 5
  }
}
```

**cURL Example**:
```bash
curl -X PUT https://waste-dcdi.onrender.com/api/municipality/houses/HOUSE_ID_HERE \
  -H "Authorization: Bearer YOUR_GP_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "ownerName": "Updated Owner Name",
    "address": "456 New Address",
    "totalMembers": 5
  }'
```

---

### 6. Get Staff (Collection Agents)

**Endpoint**: `GET /api/municipality/staff`

**Description**: Get all collection agents/staff in the GP

**Headers**: 
```
Authorization: Bearer <gp_admin_token>
```

**Query Parameters**:
- `zoneId` (optional): Filter by zone ID

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
      "userId": "65a1b2c3d4e5f6g7h8i9j0k2",
      "name": "Collection Agent 1",
      "email": "agent1@waste.com",
      "phone": "+91-9876500001",
      "gpId": "65a1b2c3d4e5f6g7h8i9j0k3",
      "zoneId": {
        "_id": "65a1b2c3d4e5f6g7h8i9j0k4",
        "name": "Block North - GP 1 - Zone A"
      },
      "assignedVanId": {
        "_id": "65a1b2c3d4e5f6g7h8i9j0k5",
        "registrationNumber": "WB-0001"
      },
      "employeeId": "EMP-0001",
      "isActive": true
    }
  ]
}
```

**cURL Example**:
```bash
# Get all staff
curl https://waste-dcdi.onrender.com/api/municipality/staff \
  -H "Authorization: Bearer YOUR_GP_ADMIN_TOKEN"

# Filter by zone
curl "https://waste-dcdi.onrender.com/api/municipality/staff?zoneId=ZONE_ID_HERE" \
  -H "Authorization: Bearer YOUR_GP_ADMIN_TOKEN"
```

---

### 7. Get Vans

**Endpoint**: `GET /api/municipality/vans`

**Description**: Get all collection vans in the GP

**Headers**: 
```
Authorization: Bearer <gp_admin_token>
```

**Query Parameters**:
- `zoneId` (optional): Filter by zone ID

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
      "registrationNumber": "WB-0001",
      "gpId": "65a1b2c3d4e5f6g7h8i9j0k2",
      "zoneId": {
        "_id": "65a1b2c3d4e5f6g7h8i9j0k3",
        "name": "Block North - GP 1 - Zone A"
      },
      "capacity": 1000,
      "driverName": "Driver 1",
      "isActive": true
    }
  ]
}
```

**cURL Example**:
```bash
curl https://waste-dcdi.onrender.com/api/municipality/vans \
  -H "Authorization: Bearer YOUR_GP_ADMIN_TOKEN"
```

---

### 8. Get Waste Data

**Endpoint**: `GET /api/municipality/waste-data`

**Description**: Get waste collection data and statistics

**Headers**: 
```
Authorization: Bearer <gp_admin_token>
```

**Query Parameters**:
- `startDate` (optional): Start date (ISO 8601 format)
- `endDate` (optional): End date (ISO 8601 format)

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "stats": {
      "totalCollections": 150,
      "totalWaste": 1450.5,
      "solidWaste": 800.2,
      "plasticWaste": 350.3,
      "organicWaste": 250.0,
      "eWaste": 50.0
    },
    "collections": [
      {
        "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
        "houseId": {
          "houseNumber": "H-001",
          "ownerName": "Rajesh Kumar"
        },
        "agentId": {
          "name": "Collection Agent 1"
        },
        "totalWaste": 9.7,
        "solidWaste": 5.5,
        "plasticWaste": 1.2,
        "organicWaste": 3.0,
        "collectionDate": "2024-12-29T10:30:00.000Z",
        "status": "DUMPED"
      }
    ]
  }
}
```

**cURL Examples**:
```bash
# Get all waste data
curl https://waste-dcdi.onrender.com/api/municipality/waste-data \
  -H "Authorization: Bearer YOUR_GP_ADMIN_TOKEN"

# Filter by date range
curl "https://waste-dcdi.onrender.com/api/municipality/waste-data?startDate=2024-12-01&endDate=2024-12-31" \
  -H "Authorization: Bearer YOUR_GP_ADMIN_TOKEN"

# Get today's data
curl "https://waste-dcdi.onrender.com/api/municipality/waste-data?startDate=$(date +%Y-%m-%d)" \
  -H "Authorization: Bearer YOUR_GP_ADMIN_TOKEN"
```

---

### 9. Get Attendance

**Endpoint**: `GET /api/municipality/attendance`

**Description**: Get staff attendance records

**Headers**: 
```
Authorization: Bearer <gp_admin_token>
```

**Query Parameters**:
- `date` (optional): Specific date (ISO 8601 format)
- `startDate` (optional): Start date (ISO 8601 format)
- `endDate` (optional): End date (ISO 8601 format)

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
      "agentId": {
        "name": "Collection Agent 1",
        "employeeId": "EMP-0001"
      },
      "date": "2024-12-29T00:00:00.000Z",
      "checkInTime": "2024-12-29T06:15:00.000Z",
      "checkOutTime": "2024-12-29T14:30:00.000Z",
      "status": "PRESENT",
      "totalDuration": 495
    }
  ]
}
```

**cURL Examples**:
```bash
# Get all attendance
curl https://waste-dcdi.onrender.com/api/municipality/attendance \
  -H "Authorization: Bearer YOUR_GP_ADMIN_TOKEN"

# Get specific date
curl "https://waste-dcdi.onrender.com/api/municipality/attendance?date=2024-12-29" \
  -H "Authorization: Bearer YOUR_GP_ADMIN_TOKEN"

# Get date range
curl "https://waste-dcdi.onrender.com/api/municipality/attendance?startDate=2024-12-01&endDate=2024-12-31" \
  -H "Authorization: Bearer YOUR_GP_ADMIN_TOKEN"
```

---

## Block Admin APIs

All endpoints require `BLOCK_ADMIN` role.

### 1. Get Municipalities

**Endpoint**: `GET /api/block/municipalities`

**Description**: Get all municipalities/GPs under the block

**Headers**: 
```
Authorization: Bearer <block_admin_token>
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
      "name": "Block North - GP 1",
      "code": "BN-GP1",
      "type": "GRAM_PANCHAYAT",
      "blockId": "65a1b2c3d4e5f6g7h8i9j0k2",
      "contactNumber": "+91-9876543210",
      "address": "Block North Administrative Office",
      "isActive": true,
      "totalZones": 2,
      "totalHouses": 0,
      "totalStaff": 4,
      "totalVans": 2
    }
  ]
}
```

**cURL Example**:
```bash
curl https://waste-dcdi.onrender.com/api/block/municipalities \
  -H "Authorization: Bearer YOUR_BLOCK_ADMIN_TOKEN"
```

---

### 2. Get Block Overview

**Endpoint**: `GET /api/block/overview`

**Description**: Get block-level overview statistics

**Headers**: 
```
Authorization: Bearer <block_admin_token>
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "totalMunicipalities": 2,
    "totalHouses": 0,
    "todayCollections": 0,
    "totalWasteToday": 0
  }
}
```

**cURL Example**:
```bash
curl https://waste-dcdi.onrender.com/api/block/overview \
  -H "Authorization: Bearer YOUR_BLOCK_ADMIN_TOKEN"
```

---

### 3. Get Staff Overview

**Endpoint**: `GET /api/block/staff-overview`

**Description**: Get staff overview for the entire block

**Headers**: 
```
Authorization: Bearer <block_admin_token>
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "totalStaff": 8,
    "presentToday": 0,
    "absentToday": 8
  }
}
```

**cURL Example**:
```bash
curl https://waste-dcdi.onrender.com/api/block/staff-overview \
  -H "Authorization: Bearer YOUR_BLOCK_ADMIN_TOKEN"
```

---

## Collection Agent APIs

All endpoints require `COLLECTION_AGENT` role.

### 1. Scan House QR

**Endpoint**: `POST /api/agent/scan-house`

**Description**: Scan house QR code to verify and prepare for collection

**Headers**: 
```
Authorization: Bearer <agent_token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "qrCode": "HOUSE:65a1b2c3d4e5f6g7h8i9j0k1:H-001:65a1b2c3d4e5f6g7h8i9j0k2:uuid-here",
  "latitude": 22.5726,
  "longitude": 88.3639
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "House QR scanned successfully",
  "data": {
    "house": {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
      "houseNumber": "H-001",
      "ownerName": "Rajesh Kumar",
      "address": "123 Main Street",
      "latitude": null,
      "longitude": null,
      "isGPSActive": false
    },
    "requiresGPSSetup": true
  }
}
```

**cURL Example**:
```bash
curl -X POST https://waste-dcdi.onrender.com/api/agent/scan-house \
  -H "Authorization: Bearer YOUR_AGENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "qrCode": "HOUSE:HOUSE_ID:H-001:GP_ID:uuid",
    "latitude": 22.5726,
    "longitude": 88.3639
  }'
```

---

### 2. Accept Waste

**Endpoint**: `POST /api/agent/accept-waste`

**Description**: Record waste collection from a house with GPS validation

**Headers**: 
```
Authorization: Bearer <agent_token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "houseId": "65a1b2c3d4e5f6g7h8i9j0k1",
  "latitude": 22.5726,
  "longitude": 88.3639,
  "solidWaste": 5.5,
  "plasticWaste": 1.2,
  "organicWaste": 3.0,
  "eWaste": 0,
  "totalWaste": 9.7,
  "notes": "Regular collection"
}
```

**Validations**:
- ✅ Agent must belong to same GP as house
- ✅ Must be within operational hours (06:00 - 18:00)
- ✅ No duplicate collection on same day
- ✅ GPS validation: Must be within 50m of house (if house has GPS)
- ✅ First scan: Sets house GPS coordinates

**Response** (201 Created):
```json
{
  "success": true,
  "message": "Waste collection recorded successfully",
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "houseId": {
      "houseNumber": "H-001",
      "ownerName": "Rajesh Kumar"
    },
    "agentId": {
      "name": "Collection Agent 1"
    },
    "agentLatitude": 22.5726,
    "agentLongitude": 88.3639,
    "solidWaste": 5.5,
    "plasticWaste": 1.2,
    "organicWaste": 3.0,
    "totalWaste": 9.7,
    "collectionDate": "2024-12-29T10:30:00.000Z",
    "status": "COLLECTED"
  }
}
```

**cURL Example**:
```bash
curl -X POST https://waste-dcdi.onrender.com/api/agent/accept-waste \
  -H "Authorization: Bearer YOUR_AGENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "houseId": "HOUSE_ID_FROM_SCAN",
    "latitude": 22.5726,
    "longitude": 88.3639,
    "solidWaste": 5.5,
    "plasticWaste": 1.2,
    "organicWaste": 3.0,
    "eWaste": 0.0,
    "totalWaste": 9.7,
    "notes": "Regular collection"
  }'
```

---

### 3. Scan Dump Site

**Endpoint**: `POST /api/agent/scan-dump`

**Description**: Scan dump site QR to verify waste dumping and complete shift

**Headers**: 
```
Authorization: Bearer <agent_token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "qrCode": "DUMP:65a1b2c3d4e5f6g7h8i9j0k1:Dump-Site-1:65a1b2c3d4e5f6g7h8i9j0k2:uuid-here",
  "latitude": 22.5800,
  "longitude": 88.3700
}
```

**Validations**:
- ✅ Must be within 100m of dump site
- ✅ Updates all today's COLLECTED status to DUMPED

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Dump verification successful",
  "data": {
    "dumpSite": {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
      "name": "Block North - GP 1 - Dump Site",
      "latitude": 22.5800,
      "longitude": 88.3700,
      "capacity": 100,
      "currentLoad": 0
    },
    "collectionsUpdated": 15
  }
}
```

**cURL Example**:
```bash
curl -X POST https://waste-dcdi.onrender.com/api/agent/scan-dump \
  -H "Authorization: Bearer YOUR_AGENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "qrCode": "DUMP:DUMP_ID:Site-Name:GP_ID:uuid",
    "latitude": 22.5800,
    "longitude": 88.3700
  }'
```

---

### 4. Get Pending Houses

**Endpoint**: `GET /api/agent/pending-houses`

**Description**: Get pending houses for collection (route optimization)

**Headers**: 
```
Authorization: Bearer <agent_token>
```

**Query Parameters**:
- `latitude` (optional): Agent's current latitude (for distance sorting)
- `longitude` (optional): Agent's current longitude (for distance sorting)

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
      "houseNumber": "H-002",
      "ownerName": "Priya Sharma",
      "address": "456 Second Street",
      "latitude": 22.5730,
      "longitude": 88.3645,
      "isGPSActive": true,
      "totalMembers": 5,
      "distance": 125.5
    },
    {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k2",
      "houseNumber": "H-003",
      "ownerName": "Amit Patel",
      "address": "789 Third Avenue",
      "latitude": 22.5735,
      "longitude": 88.3650,
      "isGPSActive": true,
      "totalMembers": 3,
      "distance": 256.3
    }
  ]
}
```

**cURL Examples**:
```bash
# Get all pending houses
curl https://waste-dcdi.onrender.com/api/agent/pending-houses \
  -H "Authorization: Bearer YOUR_AGENT_TOKEN"

# Get sorted by distance (route optimization)
curl "https://waste-dcdi.onrender.com/api/agent/pending-houses?latitude=22.5726&longitude=88.3639" \
  -H "Authorization: Bearer YOUR_AGENT_TOKEN"
```

---

### 5. Get Today's Summary

**Endpoint**: `GET /api/agent/today-summary`

**Description**: Get today's collection summary for the agent

**Headers**: 
```
Authorization: Bearer <agent_token>
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "totalCollected": 15,
    "totalWaste": 145.5,
    "dumped": 15,
    "pending": 0,
    "collections": [
      {
        "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
        "houseId": {
          "houseNumber": "H-001",
          "ownerName": "Rajesh Kumar"
        },
        "totalWaste": 9.7,
        "collectionDate": "2024-12-29T10:30:00.000Z",
        "status": "DUMPED"
      }
    ]
  }
}
```

**cURL Example**:
```bash
curl https://waste-dcdi.onrender.com/api/agent/today-summary \
  -H "Authorization: Bearer YOUR_AGENT_TOKEN"
```

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Valid email is required"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "No token provided. Please login."
}
```

### 403 Forbidden (RBAC)
```json
{
  "success": false,
  "message": "Access denied. Insufficient permissions."
}
```

### 403 Forbidden (GPS Validation)
```json
{
  "success": false,
  "message": "GPS validation failed. You must be within 50m of the location. Current distance: 125m",
  "code": "GPS_OUT_OF_RANGE"
}
```

### 403 Forbidden (Time Violation)
```json
{
  "success": false,
  "message": "Collection only allowed between 06:00 and 18:00"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Route /api/invalid/route not found"
}
```

### 409 Conflict (Duplicate)
```json
{
  "success": false,
  "message": "This house has already been collected today"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Internal server error"
}
```

---

## Test User Accounts

Use these accounts for testing different roles:

| Role | Email | Password | Login Role |
|------|-------|----------|------------|
| **State Admin** | state@admin.com | admin123 | STATE_ADMIN |
| **District Admin** | district@admin.com | admin123 | DISTRICT_ADMIN |
| **Block Admin** | blockbn@admin.com | admin123 | BLOCK_ADMIN |
| **GP Admin** | gpbn-gp1@admin.com | admin123 | GP_ADMIN |
| **Collection Agent** | agent1@waste.com | agent123 | COLLECTION_AGENT |

---

## Complete Workflow Example

### Scenario: GP Admin creates house, Agent collects waste, Agent dumps waste

#### Step 1: Login as GP Admin
```bash
curl -X POST https://waste-dcdi.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "gpbn-gp1@admin.com",
    "password": "admin123",
    "role": "GP_ADMIN"
  }'
```

Save the token from response: `GP_TOKEN`

#### Step 2: Get Zones (to get zoneId)
```bash
curl https://waste-dcdi.onrender.com/api/municipality/zones \
  -H "Authorization: Bearer GP_TOKEN"
```

Save a `zoneId` from response.

#### Step 3: Create House
```bash
curl -X POST https://waste-dcdi.onrender.com/api/municipality/houses \
  -H "Authorization: Bearer GP_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "houseNumber": "H-TEST-001",
    "ownerName": "Test Owner",
    "address": "Test Address, Kolkata",
    "zoneId": "ZONE_ID_FROM_STEP_2",
    "totalMembers": 4
  }'
```

Save `houseId` and `qrCode` from response.

#### Step 4: Login as Collection Agent
```bash
curl -X POST https://waste-dcdi.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "agent1@waste.com",
    "password": "agent123",
    "role": "COLLECTION_AGENT"
  }'
```

Save the token: `AGENT_TOKEN`

#### Step 5: Scan House QR
```bash
curl -X POST https://waste-dcdi.onrender.com/api/agent/scan-house \
  -H "Authorization: Bearer AGENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "qrCode": "QR_CODE_FROM_STEP_3",
    "latitude": 22.5726,
    "longitude": 88.3639
  }'
```

#### Step 6: Accept Waste (First scan - sets house GPS)
```bash
curl -X POST https://waste-dcdi.onrender.com/api/agent/accept-waste \
  -H "Authorization: Bearer AGENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "houseId": "HOUSE_ID_FROM_STEP_3",
    "latitude": 22.5726,
    "longitude": 88.3639,
    "solidWaste": 5.5,
    "plasticWaste": 1.2,
    "organicWaste": 3.0,
    "eWaste": 0,
    "totalWaste": 9.7
  }'
```

#### Step 7: Get Pending Houses
```bash
curl "https://waste-dcdi.onrender.com/api/agent/pending-houses?latitude=22.5726&longitude=88.3639" \
  -H "Authorization: Bearer AGENT_TOKEN"
```

#### Step 8: Scan Dump Site (Complete shift)
```bash
# First get dump site QR from GP Admin or seed data
curl -X POST https://waste-dcdi.onrender.com/api/agent/scan-dump \
  -H "Authorization: Bearer AGENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "qrCode": "DUMP_QR_CODE",
    "latitude": 22.5800,
    "longitude": 88.3700
  }'
```

#### Step 9: Check Today's Summary
```bash
curl https://waste-dcdi.onrender.com/api/agent/today-summary \
  -H "Authorization: Bearer AGENT_TOKEN"
```

---

## Notes

1. **GPS Validation**: 
   - First scan on a house sets GPS coordinates
   - Subsequent scans must be within 50m
   - Violations are logged in `FraudLog` collection

2. **Operational Hours**: 
   - Default: 06:00 - 18:00
   - Configurable in `.env` file
   - Violations are logged as fraud

3. **Duplicate Prevention**: 
   - One collection per house per day
   - Duplicate attempts logged as fraud

4. **Token Expiration**: 
   - Default: 24 hours
   - Configurable in `.env` file

5. **RBAC Hierarchy**:
   - Lower levels CANNOT access higher level data
   - Higher levels CAN access all lower level data

---

**Happy Testing! 🚀**
