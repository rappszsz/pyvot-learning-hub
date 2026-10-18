import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
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
import Pricing from './pages/Pricing.jsx'
import PaymentApprovals from './pages/PaymentApprovals.jsx'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CourseProvider>
          <Routes>
          <Route element={<AuthLayout />}>
            <Route path="login" element={<StudentLogin />} />
            <Route path="register" element={<Register />} />
            <Route path="instructor/login" element={<InstructorLogin />} />
          </Route>
          <Route element={<AppLayout />}>
            <Route path="pricing" element={<Pricing />} />
            <Route element={<ProtectedRoute />}>
              <Route path="profile" element={<Profile />} />
            </Route>
            <Route path="courses/:courseId" element={<CourseDetail />} />
            <Route element={<ProtectedRoute />}>
              <Route path="courses/:courseId/lessons" element={<LessonLayout />}>
                <Route path=":lessonId" element={<LessonPlayer />} />
              </Route>
            </Route>
            <Route path="instructor" element={<Navigate replace to="/instructor/dashboard" />} />
            <Route path="instructor/upload" element={<Navigate replace to="/instructor/courses/create" />} />
            <Route element={<InstructorRoute />}>
              <Route path="instructor/dashboard" element={<InstructorDashboard />} />
              <Route path="instructor/payment-approvals" element={<PaymentApprovals />} />
              <Route path="instructor/courses/create" element={<InstructorUpload />} />
              <Route path="instructor/courses/:courseId" element={<InstructorCourseManagement />} />
              <Route path="instructor/materials" element={<InstructorMaterials />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Route>
          <Route path="/" element={<CatalogPage />} />
          <Route path="courses" element={<CatalogPage />} />
          </Routes>
        </CourseProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
