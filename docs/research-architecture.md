# Adaptive Learning Platform Architecture

## Recommended Figure Caption

Figure X. High-level architecture of the AI-powered adaptive learning platform for neurodiverse learners.

## Architecture Style

The system follows a layered web architecture with service-oriented augmentation:

- Presentation layer: React single-page application for students, teachers, and parents.
- Application layer: Node.js/Express REST API implementing authentication, personalization, adaptive learning, analytics, classrooms, parent monitoring, and notifications.
- Intelligence layer: Python FastAPI microservice for learner screening and progress-status prediction, plus external generative AI services.
- Data layer: MongoDB collections for users, learner profiles, progress, roadmaps, AI context, classrooms, notifications, and screening results.

## Research-Paper-Ready Diagram

```mermaid
flowchart LR
    student[Student]
    teacher[Teacher]
    parent[Parent]

    subgraph client["Presentation Layer: React + Vite SPA"]
        auth["Authentication & Session
        AuthContext + JWT in localStorage"]
        access["Accessibility & Neurodiverse UI
        theme, font, reading ruler, focus options"]
        learningui["Learning Experience
        subjects, topics, roadmap, quizzes, screening"]
        teacherui["Teacher Workspace
        classrooms, student progress, alerts"]
        parentui["Parent Workspace
        linked students, progress view"]
    end

    subgraph api["Application Layer: Node.js + Express REST API"]
        authsvc["Auth Service
        register, login, RBAC"]
        profilesvc["Profile & Screening Service
        student profile, screening submission"]
        learnsvc["Learning Orchestration Service
        topics, quizzes, roadmap, events, XP"]
        aisvc["AI Content Service
        lesson generation, subtopics, quiz generation, speech"]
        analyticsvc["Analytics Service
        dashboards, streaks, alerts"]
        classsvc["Classroom Collaboration Service
        classes, posts, comments, file upload"]
        parentsvc["Parent Monitoring Service
        student linking and detail view"]
        notifsvc["Notification Service"]
    end

    subgraph ml["Intelligence Layer: Python FastAPI ML Service"]
        screeningml["Trait Screening Model
        predict-trait"]
        progressml["Progress Status Model
        predict mastered/developing/weak"]
        keywordml["Keyword Extraction
        RAKE + NLTK"]
    end

    subgraph data["Data Layer: MongoDB via Mongoose"]
        users[("User")]
        profiles[("StudentProfile")]
        curriculum[("Subject / Topic / Quiz")]
        progress[("Progress / SubjectProgress")]
        roadmap[("Roadmap / RoadmapProgress")]
        activity[("LearningEvent")]
        screeningdb[("ScreeningResponse")]
        aicache[("AIContext / GeneratedContent")]
        social[("Classroom / ClassroomPost")]
        relations[("ParentLink")]
        notices[("Notification")]
    end

    subgraph ext["External Services"]
        groq["Groq LLM API
        lesson, summary, quiz, subtopic generation"]
        murf["Murf API
        text-to-speech audio streaming"]
        runware["Runware Image API
        browser-side educational image generation"]
        cloudinary["Cloudinary
        classroom attachment storage"]
    end

    student --> auth
    student --> access
    student --> learningui
    teacher --> teacherui
    parent --> parentui

    auth --> authsvc
    learningui --> profilesvc
    learningui --> learnsvc
    learningui --> aisvc
    teacherui --> analyticsvc
    teacherui --> classsvc
    parentui --> parentsvc
    parentui --> analyticsvc

    authsvc --> users
    profilesvc --> profiles
    profilesvc --> screeningdb
    learnsvc --> curriculum
    learnsvc --> progress
    learnsvc --> roadmap
    learnsvc --> activity
    learnsvc --> profiles
    aisvc --> aicache
    analyticsvc --> progress
    analyticsvc --> roadmap
    analyticsvc --> activity
    analyticsvc --> profiles
    classsvc --> social
    classsvc --> notices
    parentsvc --> relations
    parentsvc --> users
    notifsvc --> notices

    profilesvc --> screeningml
    learnsvc --> progressml
    aisvc --> keywordml

    aisvc --> groq
    aisvc --> murf
    learningui --> runware
    classsvc --> cloudinary
```

## Architectural Interpretation

1. The frontend is a role-aware single-page application used by three stakeholders: students, teachers, and parents.
2. The Node.js backend is the system core. It exposes REST endpoints, enforces JWT-based access control, orchestrates learning workflows, stores state in MongoDB, and brokers calls to AI and ML services.
3. The Python ML microservice is separated from the main API because predictive functions are model-driven and use a different technology stack from the transactional backend.
4. Adaptive behavior is implemented through a combination of learner profile data, quiz/performance telemetry, roadmap progression, learning-event tracking, and AI-generated lesson content.
5. External AI services are used selectively:
   - Groq generates text-based instructional content and quizzes.
   - Murf generates speech/audio output.
   - Runware is invoked directly from the browser for visual learning assets.
   - Cloudinary stores classroom attachments when configured.

## Core Architectural Flow

1. A user authenticates through the React client, which stores a JWT and sends it on subsequent API calls.
2. Students complete screening and learning activities through the frontend.
3. The backend persists user, profile, curriculum, progress, roadmap, and event data in MongoDB.
4. For adaptive decisions, the backend calls the FastAPI ML service for trait screening and progress-status prediction.
5. For AI-generated pedagogy, the backend calls Groq to create lessons, summaries, subtopics, and quizzes, then optionally calls Murf for narration.
6. The frontend may directly request educational images from Runware using prompts returned by the backend.
7. Teachers and parents consume analytics generated from stored progress and activity data.

## Paper Notes

- If you need a cleaner publication figure, export the Mermaid diagram to SVG and place the caption above or below it.
- If your supervisor prefers a stricter software-engineering label, describe this as a "layered microservice-assisted adaptive learning architecture".
- If you want, this diagram can be converted next into:
  - a deployment diagram,
  - a C4 container diagram,
  - or a black-and-white thesis figure version.
