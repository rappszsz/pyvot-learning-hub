import { Navigate, useParams } from 'react-router-dom'
import { useCourses } from '../context/CourseContext.jsx'
import { API_BASE_URL } from '../lib/api.js'

function LessonPlayer() {
  const { courseId, lessonId } = useParams()
  const course = useCourses().find((item) => item.id === courseId)
  const lesson = course?.lessons.find((item) => item.id === lessonId)

  if (!lesson) return <Navigate replace to="/" />

  const videoUrl = new URL(`/storage/${lesson.path}`, API_BASE_URL).toString()

  return (
    <article>
      <video className="aspect-video w-full rounded bg-slate-950" controls preload="metadata">
        <source src={videoUrl} type={lesson.mime_type} />
        Your browser does not support video playback.
      </video>
      <h1 className="mt-6 text-2xl font-bold">{lesson.title}</h1>
      <p className="mt-3 text-slate-600">{course.description}</p>
    </article>
  )
}

export default LessonPlayer