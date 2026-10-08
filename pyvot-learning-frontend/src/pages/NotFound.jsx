import { Link } from 'react-router-dom'

function NotFound() {
  return (
    <section>
      <h1 className="text-3xl font-bold">Page not found</h1>
      <Link className="mt-4 inline-block text-blue-700 hover:underline" to="/">
        Browse courses
      </Link>
    </section>
  )
}

export default NotFound