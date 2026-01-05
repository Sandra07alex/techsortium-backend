# Techsortium Backend API

Backend API for Techsortium event registration system with MongoDB Atlas, ImgBB integration, and comprehensive validation.

## Features

- ✅ Event management API endpoints
- ✅ Registration API with payment screenshot upload
- ✅ ImgBB integration for payment screenshot storage
- ✅ MongoDB Atlas for data persistence
- ✅ Comprehensive input validation
- ✅ Rate limiting (10 requests per 5 minutes)
- ✅ CORS enabled
- ✅ Error handling and logging
- ✅ Duplicate email/IEEE membership prevention
- ✅ Event capacity management

## Prerequisites

- Node.js (v14 or higher)
- MongoDB Atlas account (or local MongoDB)
- ImgBB API key ([Get one here](https://api.imgbb.com/))

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```bash
cp .env.example .env
```

3. Configure your `.env` file:
```env
PORT=5000
MONGODB_URI=your_mongodb_atlas_connection_string
IMGBB_API_KEY=your_imgbb_api_key
FRONTEND_URL=http://localhost:5173
```

## Running the Server

Development mode (with nodemon):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

## API Endpoints

### 1. Health Check
**GET** `/`

**Response:**
```json
{
  "success": true,
  "running": true,
  "service": "Techsortium Backend API",
  "timestamp": "2025-01-XXT10:30:00.000Z"
}
```

### 2. Get All Events
**GET** `/api/events`

**Response:**
```json
[
  {
    "id": "w1",
    "title": "Full Stack Web Development",
    "slug": "fullstack-web-dev",
    "track": "workshops",
    "shortDescription": "Master modern web development...",
    "longDescription": "Dive deep into full-stack...",
    "posterUrl": "https://...",
    "datetime": "2024-03-15T09:00:00",
    "capacity": 50,
    "fee": 299,
    "qrPaymentRequired": true,
    "requirements": ["Laptop required"]
  }
]
```

### 3. Get Single Event
**GET** `/api/events/:slug`

**Response:**
```json
{
  "id": "w1",
  "title": "Full Stack Web Development",
  "slug": "fullstack-web-dev",
  ...
}
```

**Error Response (404):**
```json
{
  "success": false,
  "message": "Event not found"
}
```

### 4. Register for Event
**POST** `/api/register`

**Content-Type:** `multipart/form-data` (when payment screenshot is included) or `application/json`

**Request Body:**
```javascript
{
  eventSlug: string,              // Required: Event slug
  name: string,                   // Required: Min 2 characters
  email: string,                  // Required: Valid email format
  whatsapp: string,               // Required: 10 digits
  college: string,                // Required: Min 2 characters
  semester: string,               // Required: "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "PG"
  branch: string,                 // Required: Min 2 characters
  isIEEEMember: boolean,          // Required: true | false
  membershipGrade: string,        // Required if isIEEEMember: "Student" | "Professional" | "Other"
  membershipNumber: string,       // Required if isIEEEMember: Min 5 characters
  paymentDone: boolean,           // Required: true | false
  paymentScreenshot: File        // Required if paymentDone: true (image file, max 5MB)
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Registration successful",
  "id": "TS-550E8400",
  "next": "thank-you",
  "data": {
    "registrationId": "TS-550E8400",
    "email": "user@example.com",
    "status": "pending_verification"
  }
}
```

**Error Responses:**

- **400 Bad Request** - Validation errors:
```json
{
  "success": false,
  "message": "Validation failed",
  "errorCode": "VALIDATION_ERROR",
  "errors": ["Error message 1", "Error message 2"]
}
```

- **409 Conflict** - Duplicate registration:
```json
{
  "success": false,
  "message": "Already registered",
  "error": "This email address has already been used for this event",
  "errorCode": "DUPLICATE_EMAIL"
}
```

- **409 Conflict** - Event full:
```json
{
  "success": false,
  "message": "Event is full",
  "error": "This event has reached its capacity limit",
  "errorCode": "EVENT_FULL"
}
```

- **429 Too Many Requests** - Rate limited:
```json
{
  "success": false,
  "message": "Too many registration attempts, please try again later.",
  "errorCode": "TOO_MANY_REQUESTS"
}
```

### 5. Get Registrations for Event
**GET** `/api/registrations/:slug`

**Response:**
```json
[
  {
    "registrationId": "TS-550E8400",
    "eventSlug": "fullstack-web-dev",
    "name": "John Doe",
    "email": "john@example.com",
    "status": "pending_verification",
    ...
  }
]
```

### 6. Get Registration by ID
**GET** `/api/registration/:id`

**Response:**
```json
{
  "success": true,
  "data": {
    "registrationId": "TS-550E8400",
    "eventSlug": "fullstack-web-dev",
    "name": "John Doe",
    ...
  }
}
```

## Database Schema

### MongoDB Database: `techsortium`

#### Collection: `events`
```javascript
{
  id: string,                    // Unique event ID
  title: string,                 // Event title
  slug: string,                  // URL-friendly slug (unique)
  track: string,                 // "workshops" | "competitions" | "sds" | "hackathon"
  shortDescription: string,       // Brief description
  longDescription: string,       // Detailed description
  posterUrl: string,             // Event poster image URL
  datetime: string,              // ISO datetime string
  capacity: number | null,       // Max participants (null = unlimited)
  fee: number | null,            // Registration fee (null = free)
  qrPaymentRequired: boolean,   // Whether payment is required
  prizes: string[],              // Optional: Prize information
  requirements: string[]         // Optional: Event requirements
}
```

#### Collection: `registrations`
```javascript
{
  registrationId: string,        // Unique registration ID (TS-XXXXXXXX format)
  eventSlug: string,             // Event slug
  eventTitle: string,            // Event title (denormalized)
  name: string,                  // Participant name
  email: string,                 // Email (lowercase, unique per event)
  whatsapp: string,              // WhatsApp number
  college: string,               // College/Institution name
  semester: string,              // Semester (1-8 or PG)
  branch: string,               // Branch/Department
  isIEEEMember: boolean,         // IEEE membership status
  membershipGrade: string | null, // IEEE membership grade (if member)
  membershipNumber: string | null, // IEEE membership number (if member, unique)
  paymentDone: boolean,          // Payment status
  paymentScreenshotUrl: string | null, // ImgBB URL for payment screenshot
  paymentScreenshotDeleteUrl: string | null, // ImgBB delete URL
  status: string,                // "pending_payment" | "pending_verification" | "verified" | "cancelled"
  createdAt: Date,               // Registration timestamp
  updatedAt: Date                // Last update timestamp
}
```

## Validation Rules

- **name:** Minimum 2 characters
- **email:** Valid email format, unique per event
- **whatsapp:** Exactly 10 digits
- **college:** Minimum 2 characters
- **semester:** Must be "1", "2", "3", "4", "5", "6", "7", "8", or "PG"
- **branch:** Minimum 2 characters
- **isIEEEMember:** Must be boolean (true/false)
- **membershipGrade:** Required if IEEE member, must be "Student", "Professional", or "Other"
- **membershipNumber:** Required if IEEE member, minimum 5 characters, unique per event
- **paymentDone:** Must be boolean
- **paymentScreenshot:** Required if paymentDone is true, max 5MB, JPEG/PNG/WebP only

## Rate Limiting

- **10 requests per IP** per 5-minute window
- Applies to `/api/register` endpoint only
- Uses `express-rate-limit` middleware

## ImgBB Integration

Payment screenshots are uploaded to ImgBB:
- Images converted to base64 before upload
- Returns public URL and delete URL
- Max file size: 5MB
- Supported formats: JPEG, PNG, WebP
- Delete URL stored for potential cleanup

## Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `PORT` | Server port (dev only) | No | `5000` |
| `MONGODB_URI` | MongoDB Atlas connection string | Yes | - |
| `IMGBB_API_KEY` | ImgBB API key for image uploads | Yes | - |
| `FRONTEND_URL` | Frontend URL for CORS | No | `http://localhost:5173` |
| `NODE_ENV` | Environment (production/development) | No | - |
| `VERCEL` | Vercel environment flag | No | - |

## Deployment to Vercel

1. **Install Vercel CLI:**
```bash
npm i -g vercel
```

2. **Deploy:**
```bash
vercel
```

3. **Set Environment Variables in Vercel Dashboard:**
   - Go to your project settings
   - Add all required environment variables:
     - `MONGODB_URI`
     - `IMGBB_API_KEY`
     - `FRONTEND_URL` (production frontend URL)

4. **Deploy Production:**
```bash
vercel --prod
```

## MongoDB Setup

### Atlas Setup

1. Create a MongoDB Atlas account
2. Create a new cluster (free tier available)
3. Create a database user
4. Whitelist IP addresses (or use `0.0.0.0/0` for Vercel)
5. Get connection string and add to `.env`

### Database Initialization

The backend will automatically:
- Create indexes on first connection
- Create unique indexes for:
  - `events.slug`
  - `registrations.email + eventSlug` (composite)
  - `registrations.registrationId`
  - `registrations.membershipNumber` (partial, when present)

### Seeding Events

Safety-first workflow for seeds and updates:

- Backup current events (recommended before changes):
```bash
npm run dump-events
```

- Safe sync (upsert only, no deletions):
```bash
npm run sync-seed
```

- Force reseed (DESTRUCTIVE: deletes all then inserts):
```bash
npm run force-reseed
```

Add or update events by editing `seed-events.js` (the `events` array). The safe sync will add missing events and update existing ones matched by `slug`, without removing any others.

You can seed events by inserting documents into the `events` collection directly:

```javascript
db.events.insertMany([
  {
    id: "w1",
    title: "Full Stack Web Development",
    slug: "fullstack-web-dev",
    track: "workshops",
    shortDescription: "Master modern web development...",
    longDescription: "Dive deep into full-stack...",
    posterUrl: "https://...",
    datetime: "2024-03-15T09:00:00",
    capacity: 50,
    fee: 299,
    qrPaymentRequired: true,
    requirements: ["Laptop required"]
  },
  // ... more events
]);
```

## Error Codes

| Code | HTTP Status | Description |
|------|------------|-------------|
| `VALIDATION_ERROR` | 400 | Input validation failed |
| `EVENT_NOT_FOUND` | 404 | Event slug not found |
| `DUPLICATE_EMAIL` | 409 | Email already registered for event |
| `DUPLICATE_IEEE_MEMBERSHIP` | 409 | IEEE membership number already used |
| `EVENT_FULL` | 409 | Event capacity reached |
| `TOO_MANY_REQUESTS` | 429 | Rate limit exceeded |
| `FILE_UPLOAD_ERROR` | 400 | File upload failed |

## Testing

### Using cURL

**Get all events:**
```bash
curl http://localhost:5000/api/events
```

**Get single event:**
```bash
curl http://localhost:5000/api/events/fullstack-web-dev
```

**Register (without payment):**
```bash
curl -X POST http://localhost:5000/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "eventSlug": "fullstack-web-dev",
    "name": "John Doe",
    "email": "john@example.com",
    "whatsapp": "9876543210",
    "college": "Example College",
    "semester": "3",
    "branch": "CSE",
    "isIEEEMember": false,
    "paymentDone": false
  }'
```

**Register (with payment screenshot):**
```bash
curl -X POST http://localhost:5000/api/register \
  -F "eventSlug=fullstack-web-dev" \
  -F "name=John Doe" \
  -F "email=john@example.com" \
  -F "whatsapp=9876543210" \
  -F "college=Example College" \
  -F "semester=3" \
  -F "branch=CSE" \
  -F "isIEEEMember=false" \
  -F "paymentDone=true" \
  -F "paymentScreenshot=@/path/to/screenshot.jpg"
```

## Security Notes

- ✅ Rate limiting prevents abuse
- ✅ CORS configured for specific origins
- ✅ Input validation on all endpoints
- ✅ Unique constraints prevent duplicate registrations
- ✅ Sensitive data masked in logs
- ✅ File type and size restrictions
- ⚠️ Add authentication for admin endpoints (`/api/registrations/:slug`)
- ⚠️ Consider adding request signing for production

## Troubleshooting

### MongoDB Connection Issues
- Verify `MONGODB_URI` is correct
- Check IP whitelist in Atlas
- Ensure database user has proper permissions

### ImgBB Upload Failures
- Verify `IMGBB_API_KEY` is valid
- Check API quota limits
- Ensure image size is under 5MB

### CORS Errors
- Update `FRONTEND_URL` in environment variables
- Add frontend domain to CORS allowed origins

## License

ISC

---

**Author:** Techsortium Backend Team  
**Last Updated:** 2025-01-XX

