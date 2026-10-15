import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { CourseProvider } from './context/CourseContext.jsx'
import AppLayout from './layouts/AppLayout.jsx'
import AuthLayout from './layouts/AuthLayout.jsx'
import InstructorRoute from './layouts/InstructorRoute.jsx'
import LessonLayout from './layouts/LessonLayout.jsx'
import ProtectedRoute from './layouts/ProtectedRoute.jsx'
import CatalogPage from './pages/CatalogPage.jsx'
import CourseDetail from './pages/CourseDetail.jsx'
import InstructorDashboard from './pages/InstructorDashboard.jsx'
import InstructorCourseManagement from './pages/InstructorCourseManagement.jsx'
import InstructorLogin from './pages/InstructorLogin.jsx'
import InstructorMaterials from './pages/InstructorMaterials.jsx'
import InstructorUpload from './pages/InstructorUpload.jsx'
import Register from './pages/Register.jsx'
import StudentLogin from './pages/StudentLogin.jsx'
import LessonPlayer from './pages/LessonPlayer.jsx'
import NotFound from './pages/NotFound.jsx'
import Profile from './pages/Profile.jsx'

function App() {
  return (
    <BrowserRouter>
      <CourseProvider>
        <Routes>
          <Route element={<AuthLayout />}>
            <Route path="login" element={<StudentLogin />} />
            <Route path="register" element={<Register />} />
            <Route path="instructor/login" element={<InstructorLogin />} />
          </Route>
          <Route element={<AppLayout />}>
            <Route element={<ProtectedRoute />}>
              <Route path="profile" element={<Profile />} />
            </Route>
            <Route path="instructor" element={<Navigate replace to="/instructor/dashboard" />} />
            <Route path="instructor/upload" element={<Navigate replace to="/instructor/courses/create" />} />
            <Route element={<InstructorRoute />}>
              <Route path="instructor/dashboard" element={<InstructorDashboard />} />
              <Route path="instructor/courses/create" element={<InstructorUpload />} />
              <Route path="instructor/courses/:courseId" element={<InstructorCourseManagement />} />
              <Route path="instructor/materials" element={<InstructorMaterials />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Route>
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<CatalogPage />} />
            <Route element={<AppLayout />}>
              <Route path="courses/:courseId" element={<CourseDetail />} />
              <Route path="courses/:courseId/lessons" element={<LessonLayout />}>
                <Route path=":lessonId" element={<LessonPlayer />} />
              </Route>
            </Route>
          </Route>
        </Routes>
      </CourseProvider>
    </BrowserRouter>
  )
}

export default App
