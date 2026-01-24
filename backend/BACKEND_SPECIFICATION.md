# 📘 BACKEND SYSTEM DESCRIPTION

**AI-Powered Adaptive Learning Platform (MERN)**

---

## 1️⃣ BACKEND ARCHITECTURE OVERVIEW

### Technology Stack

* Runtime: Node.js
* Framework: Express.js
* Database: MongoDB
* ODM: Mongoose
* Authentication: JWT
* Architecture: REST API

### Layered Structure

```
Client (React)
 → Routes (API endpoints)
   → Controllers (business logic)
     → Models (database schema)
       → MongoDB
```

### Purpose of This Architecture

* Clean separation of concerns
* Easy debugging
* Scalable
* Easy to explain in viva

---

## 2️⃣ DATABASE DESIGN (MOST IMPORTANT)

The database is **designed around topic-level adaptiveness**, NOT user labeling.

---

### 2.1 User Collection

**Purpose:**
Stores authentication & role information.

**Fields:**

* userId (ObjectId)
* name
* email (unique)
* password (hashed)
* role

  * student
  * teacher
  * parent

**Why needed:**
Supports stakeholder involvement and role-based access.

---

### 2.2 StudentProfile Collection

**Purpose:**
Stores learner-specific personalization data.

**Fields:**

* profileId
* userId (reference to User)
* ageGroup
* educationLevel
* learningComfort (self-reported)
* neuroType

  * dyslexia
  * adhd
  * autism
  * general
* supportLevel

  * low
  * medium
  * high

**Why needed:**
Enables ethical personalization without clinical diagnosis.

---

### 2.3 Subject Collection

**Purpose:**
Defines learning domains.

**Fields:**

* subjectId
* subjectName
* syllabusDescription

**Why needed:**
Allows multiple subjects and scalability.

---

### 2.4 Topic Collection

**Purpose:**
Topic-level learning units (core of adaptiveness).

**Fields:**

* topicId
* subjectId (reference)
* topicTitle
* difficultyLevel
* normalContent
* simplifiedContent
* multimediaLinks (optional)

**Why needed:**
Allows topic-wise evaluation and reinforcement.

---

### 2.5 Quiz Collection

**Purpose:**
Assessment at topic level.

**Fields:**

* quizId
* topicId
* questions[]

  * questionText
  * options[]
  * correctOptionIndex

**Why needed:**
Continuous assessment & reinforcement logic.

---

### 2.6 Progress Collection

**Purpose:**
Tracks learner performance **per topic**.

**Fields:**

* progressId
* studentId
* topicId
* score
* status

  * mastered
  * developing
  * weak
* attempts
* lastAttemptDate

**Why needed:**
Implements internal learner modeling from your paper.

---

## 3️⃣ CONTROLLERS (LOGIC RESPONSIBILITIES)

Controllers contain **ALL adaptive intelligence**.

---

### 3.1 AuthController

**Responsibilities:**

* Register user
* Login user
* Generate JWT token

**Key Logic:**

* Password hashing
* Role assignment
* Secure authentication

---

### 3.2 ProfileController

**Responsibilities:**

* Create student profile
* Update learner attributes
* Fetch profile data

**Key Logic:**

* Non-diagnostic learner modeling
* Initial personalization support

---

### 3.3 SubjectController

**Responsibilities:**

* Add subjects (admin)
* Fetch subject list

**Key Logic:**

* Subject-wise learning isolation

---

### 3.4 TopicController

**Responsibilities:**

* Fetch topics by subject
* Deliver adaptive content

**Key Logic:**

* NeuroType-based content delivery
* Simplified vs normal content

---

### 3.5 LearningController (CORE)

**Responsibilities:**

* Submit quiz
* Evaluate performance
* Update progress
* Generate adaptive roadmap

**Evaluation Logic (Rule-Based):**

* score ≥ 80 → mastered
* 50 ≤ score < 80 → developing
* score < 50 → weak

**Why rule-based:**
Transparent, ethical, beginner-friendly.

---

### 3.6 AnalyticsController

**Responsibilities:**

* Student analytics
* Parent/Teacher dashboard data

**Metrics Provided:**

* Weak topics
* Mastered topics
* Progress percentage
* Attempt frequency

---

## 4️⃣ ROUTES (API CONTRACT)

This is what frontend & Cursor will use.

---

### 4.1 Authentication Routes

```
POST /api/auth/register
POST /api/auth/login
```

---

### 4.2 Profile Routes

```
POST /api/profile/create
GET  /api/profile/:userId
PUT  /api/profile/update
```

---

### 4.3 Learning Routes

```
GET  /api/learning/subjects
GET  /api/learning/topics/:subjectId
GET  /api/learning/topic/:topicId
POST /api/learning/submit-quiz
GET  /api/learning/roadmap/:studentId/:subjectId
```

---

### 4.4 Analytics Routes

```
GET /api/analytics/student/:studentId
GET /api/analytics/teacher/:studentId
```

---

## 5️⃣ DATA FLOW (END-TO-END)

### Student Learning Flow

```
Login
 → Select Subject
   → Get Topics
     → Study Topic
       → Attempt Quiz
         → Score Evaluation
           → Topic Classification
             → Roadmap Update
```

---

## 6️⃣ MAPPING TO YOUR RESEARCH PAPER

| Paper Section           | Backend Component    |
| ----------------------- | -------------------- |
| Learner Initialization  | StudentProfile       |
| Topic-Level Adaptation  | Progress             |
| Multimodal Delivery     | TopicController      |
| Gamification            | Progress + Analytics |
| Stakeholder Involvement | AnalyticsController  |

---

## 7️⃣ WHY THIS DESIGN IS PERFECT FOR FYP

✔ Simple but powerful
✔ Fully aligned with IEEE paper
✔ No fake ML claims
✔ Ethical & inclusive
✔ Viva-defensible
✔ Cursor-friendly

---

## 8️⃣ HOW TO USE THIS WITH CURSOR

Tell Cursor:

> "Implement backend using this specification.
> Create models, controllers, and routes exactly as described."

Cursor will generate correct files automatically.

---

## 9️⃣ WHAT I CAN DO NEXT

I can now:
1️⃣ Convert this into **API documentation**
2️⃣ Create **Cursor prompts for each file**
3️⃣ Design **Frontend API integration plan**
4️⃣ Write **Implementation chapter for report**
5️⃣ Add **Gamification & rewards design**

Tell me the next step and I'll take you all the way to submission 🚀
