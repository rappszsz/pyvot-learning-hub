import { Link, Outlet } from 'react-router-dom'
import pyvotLogo from '../assets/pyvot-logo.png'

const features = ['HD video courses', 'Interactive modules', 'Trackable progress']

function AuthLayout() {
  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12">
      <aside className="relative flex flex-col justify-between overflow-hidden bg-gradient-to-br from-purple-950 via-purple-900 to-slate-950 p-8 text-white sm:p-10 lg:col-span-5 lg:p-12">
        <div aria-hidden="true" className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-purple-500/20 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-40 -left-32 h-96 w-96 rounded-full bg-indigo-400/20 blur-3xl" />
        <Link aria-label="Pyvot Learning Hub home" className="relative inline-flex w-fit items-center" to="/">
          <div className="inline-flex items-center rounded-2xl bg-white px-5 py-3 shadow-md">
            <img alt="Pyvot Logo" className="h-10 w-auto object-contain md:h-12" src={pyvotLogo} />
          </div>
        </Link>

        <div className="relative my-12 max-w-lg lg:my-0">
          <p className="mb-5 inline-flex w-fit rounded-full bg-purple-600 px-4 py-2 text-sm font-semibold uppercase tracking-[0.2em] text-white">
            Learn without limits
          </p>
          <h2 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
            Unlock Your Potential with Pyvot Learning Hub.
          </h2>
          <p className="mt-5 max-w-md text-base leading-7 text-indigo-100">
            Build skills that move you forward with learning designed around you.
          </p>
          <ul className="mt-9 space-y-5">
            {features.map((feature) => (
              <li className="flex items-center gap-3 text-base font-medium text-white/95" key={feature}>
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/15 text-pink-100">
                  <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 20 20">
                    <path d="m5 10 3.2 3.2L15 6.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                {feature}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative hidden text-sm text-indigo-200 sm:block">
          Learn something new. Go somewhere meaningful.
        </p>
      </aside>

      <main className="flex min-h-[60vh] items-center justify-center bg-white px-6 py-12 text-slate-900 transition-colors dark:bg-slate-900 dark:text-white sm:px-10 lg:col-span-7 lg:min-h-screen lg:px-12 lg:py-16">
        <div className="w-full max-w-xl">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export default AuthLayout
