import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { CourseProvider } from './context/CourseContext.jsx'
import AppLayout from './layouts/AppLayout.jsx'
import LessonLayout from './layouts/LessonLayout.jsx'
import CatalogPage from './pages/CatalogPage.jsx'
import CourseDetail from './pages/CourseDetail.jsx'
import InstructorDashboard from './pages/InstructorDashboard.jsx'
import InstructorUpload from './pages/InstructorUpload.jsx'
import LessonPlayer from './pages/LessonPlayer.jsx'
import NotFound from './pages/NotFound.jsx'

function App() {
  return (
    <BrowserRouter>
      <CourseProvider>
        <Routes>
          <Route path="/" element={<CatalogPage />} />
          <Route element={<AppLayout />}>
            <Route path="courses/:courseId" element={<CourseDetail />} />
            <Route path="courses/:courseId/lessons" element={<LessonLayout />}>
              <Route path=":lessonId" element={<LessonPlayer />} />
            </Route>
            <Route path="instructor" element={<InstructorDashboard />} />
            <Route path="instructor/upload" element={<InstructorUpload />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </CourseProvider>
    </BrowserRouter>
  )
}

export default App
