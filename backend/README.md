# Smart Waste Management Backend API

Production-grade backend system for Smart Waste Management Platform designed for West Bengal government waste collection operations.

## 🚀 Features

- **Multi-tier RBAC**: State → District → Block → GP/Municipality → Collection Agent
- **QR Code System**: House and dump site QR code generation and scanning
- **GPS Tracking**: GPS validation with 50m radius enforcement
- **Fraud Detection**: Automatic logging of GPS violations, time violations, and duplicate scans
- **Route Optimization**: Distance-based house sorting for collection agents
- **Operational Hours**: Time-locked waste collection with configurable hours
- **Dump Verification**: Mandatory dump site scan before shift completion

## 📋 Prerequisites

- Node.js >= 18.x
- MongoDB Atlas account (or local MongoDB)
- npm or yarn

## 🛠️ Installation

1. **Clone the repository**
```bash
cd backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment Configuration**

The `.env` file is already configured with:
```env
MONGODB_URI=mongodb+srv://waste:waste@cluster0.a2k90rj.mongodb.net/?appName=Cluster0
JWT_SECRET=waste-management-super-secret-jwt-key-change-in-production-2024
JWT_EXPIRES_IN=24h
PORT=5000
NODE_ENV=development
GPS_VALIDATION_RADIUS=50
OPERATIONAL_HOURS_START=06:00
OPERATIONAL_HOURS_END=18:00
```

⚠️ **Important**: Change `JWT_SECRET` in production!

## 🏃 Running the Server

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The server will start on `http://localhost:5000`

## 📚 API Documentation

### Authentication

#### POST `/api/auth/login`
Login with email, password, and role.

**Request:**
```json
{
  "email": "admin@gp.com",
  "password": "password123",
  "role": "GP_ADMIN"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGc...",
    "user": { ...userObject }
  }
}
```

#### GET `/api/auth/session`
Get current user session (requires authentication).

**Headers:**
```
Authorization: Bearer <token>
```

---

### Municipality (GP Admin) APIs

All endpoints require `GP_ADMIN` role and authentication.

#### GET `/api/municipality/zones`
Get all zones in the GP.

#### GET `/api/municipality/houses`
Get all houses in the GP.

Query params: `zoneId`, `gpsStatus` (Active/Pending)

#### POST `/api/municipality/houses`
Create a new house with QR code.

**Request:**
```json
{
  "houseNumber": "H-001",
  "ownerName": "John Doe",
  "address": "123 Main St",
  "zoneId": "65a1b2c3d4e5f6g7h8i9j0k1",
  "totalMembers": 4
}
```

#### GET `/api/municipality/staff`
Get all collection agents.

#### GET `/api/municipality/vans`
Get all collection vans.

#### GET `/api/municipality/waste-data`
Get waste collection statistics.

Query params: `startDate`, `endDate` (ISO 8601 format)

#### GET `/api/municipality/attendance`
Get agent attendance records.

---

### Block Admin APIs

Requires `BLOCK_ADMIN` role.

#### GET `/api/block/municipalities`
Get all municipalities/GPs under the block.

#### GET `/api/block/overview`
Get block-level overview statistics.

#### GET `/api/block/staff-overview`
Get staff overview for the entire block.

---

### Collection Agent APIs

Requires `COLLECTION_AGENT` role.

#### POST `/api/agent/scan-house`
Scan house QR code.

**Request:**
```json
{
  "qrCode": "HOUSE:65a1b...:H-001:65b2c...:uuid",
  "latitude": 22.5726,
  "longitude": 88.3639
}
```

#### POST `/api/agent/accept-waste`
Record waste collection from a house.

**Request:**
```json
{
  "houseId": "65a1b2c3d4e5f6g7h8i9j0k1",
  "latitude": 22.5726,
  "longitude": 88.3639,
  "solidWaste": 5.5,
  "plasticWaste": 1.2,
  "organicWaste": 3.0,
  "totalWaste": 9.7
}
```

**Validations:**
- Agent must belong to same GP as house
- Must be within operational hours (06:00 - 18:00 by default)
- No duplicate collection on same day
- GPS must be within 50m of house (after first scan)
- First scan sets house GPS coordinates

#### POST `/api/agent/scan-dump`
Verify dump at dumping site.

**Request:**
```json
{
  "qrCode": "DUMP:65c3d...:Site-A:65d4e...:uuid",
  "latitude": 22.5800,
  "longitude": 88.3700
}
```

#### GET `/api/agent/pending-houses`
Get pending houses for collection (route optimization).

Query params: `latitude`, `longitude` (for distance sorting)

#### GET `/api/agent/today-summary`
Get today's collection summary for the agent.

---

## 🗂️ Project Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── database.js          # MongoDB connection
│   │   └── environment.js       # Environment variables
│   ├── models/
│   │   ├── User.js              # User model (all roles)
│   │   ├── State.js, District.js, Block.js
│   │   ├── GramPanchayat.js     # GP/Municipality
│   │   ├── Zone.js, House.js
│   │   ├── CollectionAgent.js, Van.js
│   │   ├── Collection.js        # Waste collection records
│   │   ├── DumpingSite.js, Attendance.js
│   │   ├── FraudLog.js          # Fraud detection logs
│   │   └── Route.js             # Optimized routes
│   ├── middlewares/
│   │   ├── auth.js              # JWT verification
│   │   ├── rbac.js              # Role-based access control
│   │   ├── validation.js        # Input validation
│   │   ├── gps.js               # GPS validation
│   │   └── errorHandler.js      # Error handling
│   ├── utils/
│   │   ├── jwtHelper.js         # JWT utilities
│   │   ├── gpsCalculator.js     # Haversine distance
│   │   ├── qrGenerator.js       # QR code generation
│   │   └── timeValidator.js     # Time validation
│   ├── services/
│   │   ├── authService.js
│   │   ├── houseService.js
│   │   └── collectionService.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── municipalityController.js
│   │   └── agentController.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── municipality.routes.js
│   │   ├── block.routes.js
│   │   ├── agent.routes.js
│   │   └── index.js
│   └── server.js                # Main entry point
├── .env
├── .gitignore
├── package.json
└── README.md
```

## 🔒 Security Features

1. **JWT Authentication**: Secure token-based authentication
2. **Password Hashing**: bcrypt with salt rounds
3. **RBAC**: Strict hierarchical access control
4. **Input Validation**: express-validator on all endpoints
5. **GPS Verification**: Haversine distance calculation
6. **Fraud Logging**: Automatic fraud attempt tracking
7. **Time Locking**: Operational hours enforcement

## 🗄️ Database Models

### Administrative Hierarchy
- **State** → West Bengal
- **District** → Kolkata (initially)
- **Block** → 3 blocks
- **GramPanchayat/Municipality** → Multiple GPs per block
- **Zone** → Multiple zones per GP

### Operational Models
- **User**: All system users with roles
- **House**: Houses with QR codes and GPS
- **CollectionAgent**: Waste collection staff  
- **Collection**: Waste collection records
- **DumpingSite**: Dump sites with QR codes
- **Van**: Collection vehicles
- **Attendance**: Agent attendance tracking
- **FraudLog**: Fraud detection logs
- **Route**: Optimized collection routes

## 🧪 Testing

Test the API using:
- **Postman**: Import endpoints
- **Thunder Client** (VS Code extension)
- **curl**: Command line testing

Example login:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@gp.com","password":"password123","role":"GP_ADMIN"}'
```

## 📊 Fraud Detection

The system automatically logs fraud attempts with severity levels:

- **GPS_OUT_OF_RANGE**: Agent > 50m from house location
- **TIME_VIOLATION**: Collection outside operational hours
- **DUPLICATE_SCAN**: Same house collected multiple times per day
- **UNAUTHORIZED_ACCESS**: Agent accessing different GP's houses
- **LOCATION_MISMATCH**: GPS coordinates validation failure

## 🚧 Development Roadmap

- [ ] Seed database script
- [ ] District and State admin controllers
- [ ] Real-time notification system
- [ ] Advanced analytics and reporting
- [ ] Mobile app integration
- [ ] Performance monitoring
- [ ] API rate limiting
- [ ] Comprehensive API testing suite

## 📝 License

MIT

## 👨‍💻 Author

Smart Waste Management System - West Bengal Government

---

**For support or queries, contact the development team.**
