import { Link } from 'react-router-dom'

function AuthPromptModal({ onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <section
        aria-labelledby="auth-prompt-heading"
        aria-modal="true"
        className="w-full max-w-md rounded-3xl border border-[#F0EBE1] bg-[#FFFDF9] p-6 shadow-2xl dark:border-[#383254] dark:bg-[#1A182B]/80"
        role="dialog"
      >
        <h2 className="text-xl font-bold text-slate-900 dark:text-white" id="auth-prompt-heading">
          Sign in to start learning
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
          Create a free Pyvot account to access lessons, study materials, and track your progress.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Link
            className="btn-primary px-4 py-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600"
            to="/login"
          >
            Sign In
          </Link>
          <Link
            className="btn-secondary px-4 py-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600"
            to="/register"
          >
            Create Account
          </Link>
        </div>
        <button
          className="mt-4 w-full rounded-lg px-4 py-2 text-sm font-medium text-slate-500 hover:bg-amber-50 hover:text-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white"
          onClick={onClose}
          type="button"
        >
          Continue browsing
        </button>
      </section>
    </div>
  )
}

export default AuthPromptModal
