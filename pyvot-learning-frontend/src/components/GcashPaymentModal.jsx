import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { API_BASE_URL, fetchWithCsrf } from '../lib/api.js'

const GCashPaymentModal = ({ plan, onClose }) => {
  const { user } = useAuth()
  const [referenceNumber, setReferenceNumber] = useState('')
  const [receipt, setReceipt] = useState(null)
  const [isQrUnavailable, setIsQrUnavailable] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape' && !isSubmitting) onClose()
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isSubmitting, onClose])

  async function handleSubmit(event) {
    event.preventDefault()
    setIsSubmitting(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const formData = new FormData()
      formData.set('plan_type', plan.planType)
      formData.set('reference_number', referenceNumber)
      if (receipt) formData.set('receipt', receipt)

      const response = await fetchWithCsrf(`${API_BASE_URL}/api/subscription-payments`, {
        method: 'POST',
        body: formData,
      })
      const result = await response.json()

      if (!response.ok) {
        const validationError = Object.values(result.errors || {}).flat()[0]
        throw new Error(validationError || result.message || 'Unable to submit your payment.')
      }

      setSuccessMessage(result.message)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to submit your payment.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[11000] flex items-center justify-center overflow-y-auto bg-slate-950/70 p-4"
      onClick={(event) => {
        if (event.target === event.currentTarget && !isSubmitting) onClose()
      }}
    >
      <section
        aria-labelledby="gcash-payment-title"
        aria-modal="true"
        className="my-auto max-h-[calc(100vh-2rem)] w-full max-w-lg overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 text-slate-900 shadow-2xl dark:border-[#2E2A47] dark:bg-[#1A182B] dark:text-slate-100 sm:p-8"
        role="dialog"
      >
        <header className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white" id="gcash-payment-title">
              Pay via GCash QR
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              {plan.name} · {plan.price}
            </p>
          </div>
          <button
            aria-label="Close payment modal"
            className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600 dark:text-slate-300 dark:hover:bg-[#25223A] dark:hover:text-white"
            disabled={isSubmitting}
            onClick={onClose}
            type="button"
          >
            ✕
          </button>
        </header>

        {successMessage ? (
          <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200" role="status">
            {successMessage}
            <button className="btn-primary mt-5 w-full" onClick={onClose} type="button">
              Done
            </button>
          </div>
        ) : (
          <>
            <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-300">
              Scan the QR code using your GCash app, transfer the exact amount, and submit your reference number below.
            </p>

            {isQrUnavailable ? (
              <div
                aria-label="GCash QR code is not configured"
                className="mx-auto mt-5 flex h-[200px] w-[200px] items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center text-sm text-slate-500 dark:border-[#494266] dark:bg-[#181628] dark:text-slate-400"
                role="img"
              >
                GCash QR code is not configured yet
              </div>
            ) : (
              <img
                alt="GCash payment QR code"
                className="mx-auto mt-5 h-[200px] w-[200px] rounded-xl border border-slate-200 bg-white object-contain p-2 dark:border-[#494266]"
                onError={() => setIsQrUnavailable(true)}
                src="/images/gcash-qr.png"
              />
            )}

            <dl className="mt-5 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 rounded-2xl bg-slate-50 p-4 text-sm dark:bg-[#181628]">
              <dt className="text-slate-500 dark:text-slate-400">Account name</dt>
              <dd className="text-right font-medium text-slate-900 dark:text-slate-100">Ralph Christian Andoni</dd>
              <dt className="text-slate-500 dark:text-slate-400">GCash number</dt>
              <dd className="text-right font-medium text-slate-900 dark:text-slate-100">+63 915 952 6340</dd>
              <dt className="text-slate-500 dark:text-slate-400">Plan amount</dt>
              <dd className="text-right font-semibold text-slate-900 dark:text-white">{plan.price}</dd>
            </dl>

            {!user ? (
              <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
                Sign in to submit a payment for verification.{' '}
                <Link
                  className="font-semibold underline underline-offset-2"
                  onClick={onClose}
                  state={{
                    from: {
                      pathname: '/pricing',
                      search: `?plan=${encodeURIComponent(plan.planType)}`,
                    },
                  }}
                  to="/login"
                >
                  Sign in
                </Link>
              </div>
            ) : user.is_instructor ? (
              <p className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
                Student accounts are required to submit subscription payments.
              </p>
            ) : (
              <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
                <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200" htmlFor="gcash-reference">
                  Reference Number
                  <input
                    autoComplete="off"
                    className="mt-2 block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-normal text-slate-900 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 dark:border-[#494266] dark:bg-[#181628] dark:text-white"
                    id="gcash-reference"
                    inputMode="numeric"
                    maxLength={13}
                    minLength={13}
                    onChange={(event) => setReferenceNumber(event.target.value)}
                    pattern="[0-9]{13}"
                    placeholder="Enter 13-digit GCash Ref No."
                    required
                    value={referenceNumber}
                  />
                </label>

                <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200" htmlFor="gcash-receipt">
                  Receipt Screenshot <span className="font-normal text-slate-500">(optional)</span>
                  <input
                    accept="image/*"
                    className="mt-2 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-normal text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-purple-100 file:px-3 file:py-2 file:font-semibold file:text-purple-800 dark:border-[#494266] dark:bg-[#181628] dark:text-slate-200 dark:file:bg-[#302944] dark:file:text-pink-200"
                    id="gcash-receipt"
                    onChange={(event) => setReceipt(event.target.files?.[0] || null)}
                    type="file"
                  />
                </label>

                {errorMessage && (
                  <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200" role="alert">
                    {errorMessage}
                  </p>
                )}

                <button className="btn-primary w-full disabled:cursor-wait disabled:opacity-60" disabled={isSubmitting} type="submit">
                  {isSubmitting ? 'Submitting…' : 'Submit Payment for Verification'}
                </button>
              </form>
            )}
            <p className="mt-4 text-xs leading-5 text-slate-500 dark:text-slate-400">
              Your plan remains inactive until your payment is reviewed and approved.
            </p>
          </>
        )}
      </section>
    </div>,
    document.body,
  )
}

export default GCashPaymentModal
