import { Link, Navigate, useParams } from 'react-router-dom'
import { useCourses } from '../context/CourseContext.jsx'

function CourseDetail() {
  const { courseId } = useParams()
  const course = useCourses().find((item) => item.id === courseId)

  if (!course) return <Navigate replace to="/" />

  return (
    <article>
      <p className="text-sm font-semibold text-slate-500">Course overview</p>
      <h1 className="mt-2 text-3xl font-bold">{course.title}</h1>
      <p className="mt-3 text-slate-600">{course.description}</p>
      <p className="mt-4 text-sm">Instructor: {course.instructor}</p>

      <section className="mt-10">
        <h2 className="text-xl font-semibold">Syllabus</h2>
        <ol className="mt-4 divide-y divide-slate-200 border-y border-slate-200">
          {course.lessons.map((lesson, index) => (
            <li key={lesson.id} className="py-3">
              <Link
                className="text-sm hover:text-blue-700"
                to={`/courses/${course.id}/lessons/${lesson.id}`}
              >
                <span className="mr-3 text-slate-500">{index + 1}</span>
                {lesson.title}
              </Link>
            </li>
          ))}
        </ol>
      </section>

      <Link
        className="mt-6 inline-block rounded bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
        to={`/courses/${course.id}/lessons/${course.lessons[0].id}`}
      >
        Start learning
      </Link>
    </article>
  )
}

export default CourseDetail