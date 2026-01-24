# 🚀 Backend Implementation Plan

## Phase 1: Project Setup & Configuration

### 1.1 Initialize Node.js Project
- [ ] Set up `package.json` with dependencies
- [ ] Install core packages: express, mongoose, dotenv, bcryptjs, jsonwebtoken
- [ ] Install dev dependencies: nodemon, cors
- [ ] Create `.env` file template
- [ ] Set up folder structure

### 1.2 Folder Structure
```
backend/
├── config/
│   └── database.js          # MongoDB connection
├── models/
│   ├── User.js
│   ├── StudentProfile.js
│   ├── Subject.js
│   ├── Topic.js
│   ├── Quiz.js
│   └── Progress.js
├── controllers/
│   ├── authController.js
│   ├── profileController.js
│   ├── subjectController.js
│   ├── topicController.js
│   ├── learningController.js
│   └── analyticsController.js
├── routes/
│   ├── authRoutes.js
│   ├── profileRoutes.js
│   ├── learningRoutes.js
│   └── analyticsRoutes.js
├── middleware/
│   ├── auth.js              # JWT verification
│   └── errorHandler.js
├── utils/
│   └── validators.js
├── .env
├── .gitignore
├── server.js                # Entry point
└── package.json
```

---

## Phase 2: Database Models (Mongoose Schemas)

### 2.1 User Model
- [ ] Define schema with: name, email (unique), password, role
- [ ] Add password hashing middleware (pre-save)
- [ ] Add method to compare passwords

### 2.2 StudentProfile Model
- [ ] Define schema with all fields from spec
- [ ] Add reference to User model
- [ ] Add validation for enum fields

### 2.3 Subject Model
- [ ] Define schema: subjectName, syllabusDescription
- [ ] Add timestamps

### 2.4 Topic Model
- [ ] Define schema with all fields
- [ ] Add reference to Subject
- [ ] Support multimediaLinks array

### 2.5 Quiz Model
- [ ] Define schema with questions array
- [ ] Add reference to Topic
- [ ] Validate question structure

### 2.6 Progress Model
- [ ] Define schema with all fields
- [ ] Add references to User and Topic
- [ ] Add indexes for efficient queries
- [ ] Add validation for status enum

---

## Phase 3: Middleware & Utilities

### 3.1 Authentication Middleware
- [ ] Create JWT verification middleware
- [ ] Handle token extraction from headers
- [ ] Add role-based access control helpers

### 3.2 Error Handler
- [ ] Create centralized error handling
- [ ] Format error responses consistently

### 3.3 Validators
- [ ] Email validation
- [ ] Password strength validation
- [ ] Input sanitization helpers

---

## Phase 4: Controllers Implementation

### 4.1 AuthController
- [ ] Register endpoint logic
- [ ] Login endpoint logic
- [ ] Password hashing on registration
- [ ] JWT token generation
- [ ] Error handling for duplicate emails

### 4.2 ProfileController
- [ ] Create profile logic
- [ ] Update profile logic
- [ ] Fetch profile logic
- [ ] Validate neuroType and supportLevel

### 4.3 SubjectController
- [ ] Get all subjects
- [ ] Create subject (admin only)
- [ ] Validate subject data

### 4.4 TopicController
- [ ] Get topics by subject
- [ ] Get single topic with adaptive content
- [ ] Implement neuroType-based content selection
- [ ] Return simplifiedContent or normalContent based on profile

### 4.5 LearningController (CORE)
- [ ] Submit quiz endpoint
- [ ] Calculate score from answers
- [ ] Evaluate performance (rule-based: ≥80 mastered, 50-79 developing, <50 weak)
- [ ] Update/create Progress record
- [ ] Generate adaptive roadmap
- [ ] Handle quiz validation

### 4.6 AnalyticsController
- [ ] Student analytics endpoint
- [ ] Calculate weak topics (status: 'weak')
- [ ] Calculate mastered topics (status: 'mastered')
- [ ] Calculate overall progress percentage
- [ ] Get attempt frequency
- [ ] Teacher dashboard data aggregation

---

## Phase 5: Routes Setup

### 5.1 Auth Routes
- [ ] POST /api/auth/register
- [ ] POST /api/auth/login
- [ ] Connect to AuthController

### 5.2 Profile Routes
- [ ] POST /api/profile/create (protected)
- [ ] GET /api/profile/:userId (protected)
- [ ] PUT /api/profile/update (protected)
- [ ] Connect to ProfileController

### 5.3 Learning Routes
- [ ] GET /api/learning/subjects
- [ ] GET /api/learning/topics/:subjectId
- [ ] GET /api/learning/topic/:topicId (protected)
- [ ] POST /api/learning/submit-quiz (protected)
- [ ] GET /api/learning/roadmap/:studentId/:subjectId (protected)
- [ ] Connect to respective controllers

### 5.4 Analytics Routes
- [ ] GET /api/analytics/student/:studentId (protected)
- [ ] GET /api/analytics/teacher/:studentId (protected, teacher role)
- [ ] Connect to AnalyticsController

---

## Phase 6: Server Configuration

### 6.1 Main Server File
- [ ] Import Express
- [ ] Connect to MongoDB
- [ ] Configure CORS
- [ ] Set up body parser middleware
- [ ] Register all routes
- [ ] Add error handling middleware
- [ ] Start server on port from .env

### 6.2 Environment Variables
- [ ] MONGODB_URI
- [ ] JWT_SECRET
- [ ] PORT
- [ ] NODE_ENV

---

## Phase 7: Testing & Validation

### 7.1 Manual Testing Checklist
- [ ] User registration works
- [ ] User login returns JWT
- [ ] Protected routes require authentication
- [ ] Profile creation works
- [ ] Topics return adaptive content based on neuroType
- [ ] Quiz submission calculates score correctly
- [ ] Progress updates with correct status
- [ ] Roadmap generation works
- [ ] Analytics return correct metrics

### 7.2 Error Scenarios
- [ ] Duplicate email registration
- [ ] Invalid login credentials
- [ ] Missing required fields
- [ ] Invalid JWT token
- [ ] Non-existent topic/subject IDs

---

## Phase 8: Documentation

### 8.1 API Documentation
- [ ] Document all endpoints
- [ ] Request/response examples
- [ ] Error codes and messages
- [ ] Authentication requirements

### 8.2 Code Comments
- [ ] Add JSDoc comments to controllers
- [ ] Explain complex logic
- [ ] Document rule-based evaluation

---

## Implementation Order (Recommended)

1. **Setup** → Phase 1
2. **Models** → Phase 2 (foundation)
3. **Middleware** → Phase 3 (needed for controllers)
4. **Controllers** → Phase 4 (core logic)
5. **Routes** → Phase 5 (connect everything)
6. **Server** → Phase 6 (make it run)
7. **Testing** → Phase 7 (validate)
8. **Documentation** → Phase 8 (polish)

---

## Quick Start Commands

```bash
# Install dependencies
npm install express mongoose dotenv bcryptjs jsonwebtoken cors
npm install --save-dev nodemon

# Run development server
npm run dev

# Environment variables (.env)
MONGODB_URI=mongodb://localhost:27017/adaptive-learning
JWT_SECRET=your-secret-key-here
PORT=5000
NODE_ENV=development
```

---

## Next Steps After Implementation

1. ✅ Test all endpoints with Postman/Thunder Client
2. ✅ Connect frontend to backend APIs
3. ✅ Add request validation (express-validator)
4. ✅ Add rate limiting
5. ✅ Add logging (winston/morgan)
6. ✅ Prepare for deployment
