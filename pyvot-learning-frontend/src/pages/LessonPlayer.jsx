import { Navigate, useParams } from 'react-router-dom'
import { useCourses } from '../context/CourseContext.jsx'

function LessonPlayer() {
  const { courseId, lessonId } = useParams()
  const course = useCourses().find((item) => item.id === courseId)
  const lesson = course?.lessons.find((item) => item.id === lessonId)

  if (!lesson) return <Navigate replace to="/" />

  return (
    <article>
      <div className="flex aspect-video items-center justify-center rounded bg-slate-900 text-white">
        <p className="text-sm">Video player placeholder</p>
      </div>
      <h1 className="mt-6 text-2xl font-bold">{lesson.title}</h1>
      <p className="mt-3 text-slate-600">{course.description}</p>
    </article>
  )
}

export default LessonPlayer