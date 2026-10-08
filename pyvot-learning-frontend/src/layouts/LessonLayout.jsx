import { Link, Navigate, Outlet, useParams } from 'react-router-dom'
import { useCourses } from '../context/CourseContext.jsx'

function LessonLayout() {
  const { courseId, lessonId } = useParams()
  const courses = useCourses()
  const course = courses.find((item) => item.id === courseId)

  if (!course) return <Navigate replace to="/" />
  if (!course.lessons.some((lesson) => lesson.id === lessonId)) {
    return <Navigate replace to={`/courses/${course.id}`} />
  }

  return (
    <section>
      <Link
        className="mb-6 inline-block text-sm text-slate-600 hover:text-slate-950"
        to={`/courses/${course.id}`}
      >
        Back to course overview
      </Link>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="min-w-0">
          <Outlet />
        </div>
        <aside aria-label="Course lessons" className="border-t border-slate-200 pt-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
          <h2 className="mb-4 text-base font-semibold">{course.title}</h2>
          <ol className="space-y-2">
            {course.lessons.map((lesson, index) => (
              <li key={lesson.id}>
                <Link
                  aria-current={lesson.id === lessonId ? 'page' : undefined}
                  className={`block rounded px-3 py-2 text-sm ${
                    lesson.id === lessonId
                      ? 'bg-slate-200 font-semibold'
                      : 'hover:bg-slate-100'
                  }`}
                  to={`/courses/${course.id}/lessons/${lesson.id}`}
                >
                  <span className="mr-2 text-slate-500">{index + 1}.</span>
                  {lesson.title}
                </Link>
              </li>
            ))}
          </ol>
        </aside>
      </div>
    </section>
  )
}

export default LessonLayout