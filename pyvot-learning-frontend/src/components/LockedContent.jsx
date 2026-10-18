import { Link } from 'react-router-dom'

function LockedContent() {
  return (
    <section
      aria-labelledby="locked-content-heading"
      className="flex min-h-64 flex-col items-center justify-center rounded-3xl border border-purple-100 bg-gradient-to-br from-white to-purple-50 p-8 text-center shadow-sm dark:border-[#383254] dark:bg-[#1A182B]/80 dark:shadow-2xl"
    >
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-purple-100 text-purple-600 dark:bg-pink-500/15 dark:text-pink-400">
        <svg aria-hidden="true" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
          <rect height="11" rx="2" width="14" x="5" y="10" />
          <path d="M8 10V7a4 4 0 0 1 8 0v3m-4 4v3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <h2 className="mt-4 text-xl font-bold text-slate-900 dark:text-white" id="locked-content-heading">
        Pro Subscription Required
      </h2>
      <p className="mt-2 max-w-lg text-sm leading-6 text-slate-600 dark:text-slate-300">
        Your account is currently inactive. Upgrade your plan to unlock full video lessons, study materials, and certificates.
      </p>
      <Link
        className="btn-primary mt-5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600"
        to="/pricing"
      >
        Upgrade to Access
      </Link>
    </section>
  )
}

export default LockedContent
