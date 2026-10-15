import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { API_BASE_URL, fetchWithAuth, fetchWithCsrf } from '../lib/api.js'

const tabs = ['Personal Info', 'Security', 'Subscription']

const inputClassName =
  'mt-2 block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white'

function Profile() {
  const [user, setUser] = useState(null)
  const [activeTab, setActiveTab] = useState(tabs[0])
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [bio, setBio] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    async function loadProfile() {
      try {
        const response = await fetchWithAuth(`${API_BASE_URL}/api/auth/user`, {
          signal: controller.signal,
        })
        const result = await response.json()
        if (!response.ok) {
          throw new Error(result.message || 'Unable to load your profile.')
        }

        const profileUser = result.user
        setUser(profileUser)
        setName(profileUser.name || '')
        setEmail(profileUser.email || '')
        setBio(profileUser.bio || '')
      } catch (error) {
        if (!(error instanceof Error && error.name === 'AbortError')) {
          setErrorMessage(error instanceof Error ? error.message : 'Unable to load your profile.')
        }
      } finally {
        setIsLoading(false)
      }
    }

    loadProfile()
    return () => controller.abort()
  }, [])

  async function submitRequest(url, body, successText, onSuccess) {
    setIsSubmitting(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const response = await fetchWithCsrf(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const result = await response.json()

      if (!response.ok) {
        const validationError = result.errors ? Object.values(result.errors).flat()[0] : null
        throw new Error(validationError || result.message || 'Unable to save your changes.')
      }

      onSuccess?.(result)
      setSuccessMessage(result.message || successText)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to save your changes.')
    } finally {
      setIsSubmitting(false)
    }
  }

  function saveProfile(event) {
    event.preventDefault()
    submitRequest(
      `${API_BASE_URL}/api/auth/profile`,
      { name, email, bio },
      'Profile updated successfully.',
      (result) => setUser(result.user),
    )
  }

  function updatePassword(event) {
    event.preventDefault()
    if (newPassword !== confirmPassword) {
      setErrorMessage('The new password and confirmation do not match.')
      setSuccessMessage('')
      return
    }

    submitRequest(
      `${API_BASE_URL}/api/auth/password`,
      {
        current_password: currentPassword,
        new_password: newPassword,
        new_password_confirmation: confirmPassword,
      },
      'Password updated successfully.',
      () => {
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      },
    )
  }

  if (isLoading) {
    return <p className="py-8 text-sm text-slate-600 dark:text-slate-400" role="status">Loading profile…</p>
  }

  if (!user) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-800" role="alert">
        {errorMessage || 'Unable to load your profile.'}
      </div>
    )
  }

  const initials = user.name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
  const expirationDate = user.subscription_ends_at
    ? new Date(user.subscription_ends_at).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
    : null

  return (
    <section className="mx-auto max-w-4xl text-slate-900 dark:text-white">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-pink-600">Account</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Profile &amp; Settings</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">Manage your personal details, security, and subscription.</p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div aria-label="Profile settings" className="flex overflow-x-auto border-b border-slate-200 px-4 dark:border-slate-700 sm:px-6" role="tablist">
          {tabs.map((tab) => (
            <button
              aria-selected={activeTab === tab}
              className={`shrink-0 border-b-2 px-4 py-4 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-pink-600 ${
                activeTab === tab
                  ? 'border-pink-500 text-pink-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
              id={`profile-tab-${tab.toLowerCase().replaceAll(' ', '-')}`}
              key={tab}
              onClick={() => {
                setActiveTab(tab)
                setErrorMessage('')
                setSuccessMessage('')
              }}
              role="tab"
              type="button"
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="p-5 sm:p-8">
          {errorMessage && (
            <p className="mb-5 rounded-xl bg-red-50 p-3 text-sm text-red-800" role="alert">
              {errorMessage}
            </p>
          )}
          {successMessage && (
            <p className="mb-5 rounded-xl bg-green-50 p-3 text-sm text-green-800" role="status">
              {successMessage}
            </p>
          )}

          {activeTab === 'Personal Info' && (
            <div aria-labelledby="profile-tab-personal-info" role="tabpanel">
              <form className="space-y-6" onSubmit={saveProfile}>
                <div className="flex items-center gap-4">
                  <span className="flex h-16 w-16 items-center justify-center rounded-full bg-pink-100 text-xl font-bold text-pink-800 dark:bg-pink-950 dark:text-pink-200">
                    {initials || 'U'}
                  </span>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">{user.name}</p>
                    <button
                      className="mt-1 text-sm font-semibold text-pink-600 hover:text-pink-800 disabled:cursor-not-allowed disabled:text-slate-400 dark:text-pink-300 dark:hover:text-pink-200"
                      disabled
                      title="Profile photo uploads are not available yet"
                      type="button"
                    >
                      Upload photo (coming soon)
                    </button>
                  </div>
                </div>

                <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200" htmlFor="profile-name">
                  Full Name
                  <input
                    autoComplete="name"
                    className={inputClassName}
                    id="profile-name"
                    onChange={(event) => setName(event.target.value)}
                    required
                    value={name}
                  />
                </label>
                <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200" htmlFor="profile-email">
                  Email Address
                  <input
                    autoComplete="email"
                    className={inputClassName}
                    id="profile-email"
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    type="email"
                    value={email}
                  />
                </label>
                <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200" htmlFor="profile-bio">
                  Short Bio
                  <textarea
                    className={`${inputClassName} min-h-28 resize-y`}
                    id="profile-bio"
                    maxLength={1000}
                    onChange={(event) => setBio(event.target.value)}
                    placeholder="Tell us a little about yourself"
                    value={bio}
                  />
                  <span className="mt-1 block text-right text-xs font-normal text-slate-500 dark:text-slate-400">{bio.length}/1000</span>
                </label>
                <button
                  className="rounded-xl bg-pink-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-pink-700 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={isSubmitting}
                  type="submit"
                >
                  {isSubmitting ? 'Saving…' : 'Save Changes'}
                </button>
              </form>
            </div>
          )}

          {activeTab === 'Security' && (
            <div aria-labelledby="profile-tab-security" role="tabpanel">
              <form className="max-w-xl space-y-5" onSubmit={updatePassword}>
                <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200" htmlFor="current-password">
                  Current Password
                  <input
                    autoComplete="current-password"
                    className={inputClassName}
                    id="current-password"
                    onChange={(event) => setCurrentPassword(event.target.value)}
                    required
                    type="password"
                    value={currentPassword}
                  />
                </label>
                <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200" htmlFor="new-password">
                  New Password
                  <input
                    autoComplete="new-password"
                    className={inputClassName}
                    id="new-password"
                    minLength={8}
                    onChange={(event) => setNewPassword(event.target.value)}
                    required
                    type="password"
                    value={newPassword}
                  />
                </label>
                <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200" htmlFor="confirm-password">
                  Confirm Password
                  <input
                    autoComplete="new-password"
                    className={inputClassName}
                    id="confirm-password"
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    required
                    type="password"
                    value={confirmPassword}
                  />
                </label>
                <button
                  className="rounded-xl bg-pink-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-pink-700 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={isSubmitting}
                  type="submit"
                >
                  {isSubmitting ? 'Updating…' : 'Update Password'}
                </button>
              </form>
            </div>
          )}

          {activeTab === 'Subscription' && (
            <div aria-labelledby="profile-tab-subscription" role="tabpanel">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Your subscription</h2>
              <dl className="mt-5 divide-y divide-slate-100 rounded-xl border border-slate-200 dark:divide-slate-700 dark:border-slate-700">
                <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-4">
                  <dt className="text-sm text-slate-600 dark:text-slate-400">Status</dt>
                  <dd className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold capitalize text-slate-800 dark:bg-slate-700 dark:text-slate-200">
                    {user.subscription_status || 'inactive'}
                  </dd>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-4">
                  <dt className="text-sm text-slate-600 dark:text-slate-400">Expires</dt>
                  <dd className="text-sm font-medium text-slate-900 dark:text-slate-200">{expirationDate || 'No expiration date'}</dd>
                </div>
              </dl>
              <Link
                className="mt-6 inline-flex rounded-xl bg-pink-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-pink-700"
                to="/pricing"
              >
                Upgrade or Manage Subscription
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export default Profile
