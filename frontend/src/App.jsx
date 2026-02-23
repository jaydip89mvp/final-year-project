import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './context/AuthContext';
import { AccessibilityProvider } from './context/AccessibilityContext';
import AccessibilityMenu from './components/AccessibilityMenu';
import ReadingRuler from './components/ReadingRuler';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Subjects from './pages/Subjects';
import Topics from './pages/Topics';
import TopicLearning from './pages/TopicLearning';
import SubjectLearning from './pages/SubjectLearning';
import Roadmap from './pages/Roadmap';
import Analytics from './pages/Analytics';
import ProfileCreate from './pages/ProfileCreate';
import ProfileEdit from './pages/ProfileEdit';
import ProfileView from './pages/ProfileView';
import LandingPage from './pages/LandingPage';
import TeacherSubjects from './pages/TeacherSubjects';
import StudentProgress from './pages/StudentProgress';
import TeacherClassrooms from './pages/TeacherClassrooms';
import ClassroomView from './pages/ClassroomView';
import Screening from './pages/Screening';

function App() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f172a]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <AccessibilityProvider>
      <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-indigo-500/30">
        <Navbar />
        <AccessibilityMenu />
        <ReadingRuler />
        <main className="container mx-auto px-4 py-8">
          <Routes>

            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/subjects" element={<Subjects />} />
              <Route path="/learning/subject/:subjectId" element={<SubjectLearning />} />
              <Route path="/topics/:subjectId" element={<Topics />} />
              <Route path="/topic/:topicId" element={<TopicLearning />} />
              <Route path="/roadmap/:subjectId" element={<Roadmap />} />
              <Route path="/analytics/:studentId" element={<Analytics />} />
              <Route path="/screening" element={<Screening />} />
              <Route path="/profile/create" element={<ProfileCreate />} />
              <Route path="/profile/edit" element={<ProfileEdit />} />
              <Route path="/profile/:userId" element={<ProfileView />} />

              {/* Teacher Routes */}
              <Route path="/teacher/subjects" element={<TeacherSubjects />} />
              <Route path="/teacher/students" element={<StudentProgress />} />
              <Route path="/teacher/classrooms" element={<TeacherClassrooms />} />

              {/* Shared Classroom View */}
              <Route path="/classrooms/:id" element={<ClassroomView />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </AccessibilityProvider>
  );
}

export default App;


