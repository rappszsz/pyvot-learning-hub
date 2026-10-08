import { Link } from 'react-router-dom'
import { useCourses } from '../context/CourseContext.jsx'

function CourseCatalog() {
  const courses = useCourses()

  return (
    <section>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Explore courses</h1>
        <p className="mt-2 text-slate-600">Find your next skill to build.</p>
      </div>
      <ul className="grid gap-5 sm:grid-cols-2">
        {courses.map((course) => (
          <li key={course.id} className="rounded border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-semibold">{course.title}</h2>
            <p className="mt-2 text-sm text-slate-600">{course.description}</p>
            <p className="mt-4 text-sm">Instructor: {course.instructor}</p>
            <Link
              className="mt-5 inline-block text-sm font-semibold text-blue-700 hover:underline"
              to={`/courses/${course.id}`}
            >
              View course
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default CourseCatalog