import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { API_BASE_URL, fetchWithAuth, fetchWithCsrf } from '../lib/api.js'

const planLabels = {
  '1_week': 'Weekly Pass',
  '1_month': 'Monthly Pro',
  monthly: 'Monthly Pro',
  lifetime: 'Lifetime Access',
}

const statusClasses = {
  pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
  approved: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200',
}

function PaymentApprovals() {
  const [payments, setPayments] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadingError, setLoadingError] = useState('')
  const [actionError, setActionError] = useState('')
  const [notice, setNotice] = useState('')
  const [busyPaymentId, setBusyPaymentId] = useState(null)
  const [selectedReceipt, setSelectedReceipt] = useState(null)

  const loadPayments = useCallback(async (signal) => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/api/instructor/payment-approvals`, { signal })
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Unable to load payment approvals.')
      }
      if (!Array.isArray(result.payments)) {
        throw new Error('The payment approvals response was not in the expected format.')
      }

      setPayments(result.payments)
    } catch (error) {
      if (!(error instanceof Error && error.name === 'AbortError')) {
        setLoadingError(error instanceof Error ? error.message : 'Unable to load payment approvals.')
      }
    } finally {
      if (!signal?.aborted) setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()

    fetchWithAuth(`${API_BASE_URL}/api/instructor/payment-approvals`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.message || 'Unable to load payment approvals.')
        }
        if (!Array.isArray(result.payments)) {
          throw new Error('The payment approvals response was not in the expected format.')
        }

        setPayments(result.payments)
      })
      .catch((error) => {
        if (!(error instanceof Error && error.name === 'AbortError')) {
          setLoadingError(error instanceof Error ? error.message : 'Unable to load payment approvals.')
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false)
      })

    return () => controller.abort()
  }, [])

  useEffect(() => {
    if (!selectedReceipt) return undefined

    function handleKeyDown(event) {
      if (event.key === 'Escape') setSelectedReceipt(null)
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [selectedReceipt])

  async function reviewPayment(payment, decision) {
    setBusyPaymentId(payment.id)
    setActionError('')
    setNotice('')

    try {
      const response = await fetchWithCsrf(
        `${API_BASE_URL}/api/instructor/payment-approvals/${payment.id}/${decision}`,
        { method: 'POST' },
      )
      const result = await response.json()

      if (!response.ok) {
        const validationError = Object.values(result.errors || {}).flat()[0]
        throw new Error(validationError || result.message || 'Unable to update this payment.')
      }

      setPayments((currentPayments) =>
        currentPayments.map((item) =>
          item.id === payment.id
            ? { ...item, status: decision === 'approve' ? 'approved' : 'rejected' }
            : item,
        ),
      )
      setNotice(result.message)
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Unable to update this payment.')
    } finally {
      setBusyPaymentId(null)
    }
  }

  return (
    <section aria-labelledby="payment-approvals-heading">
      <header>
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">Instructor studio</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white" id="payment-approvals-heading">
          Payment Approvals
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-300">
          Review submitted GCash payments and activate student access after confirming receipt.
        </p>
      </header>

      {actionError && (
        <p className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200" role="alert">
          {actionError}
        </p>
      )}
      {notice && (
        <p className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200" role="status">
          {notice}
        </p>
      )}

      {isLoading ? (
        <p className="mt-6 py-4 text-sm text-slate-600 dark:text-slate-400" role="status">
          Loading payment submissions…
        </p>
      ) : loadingError ? (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200" role="alert">
          <p>{loadingError}</p>
          <button
            className="mt-3 font-semibold underline underline-offset-2"
            onClick={() => {
              setIsLoading(true)
              setLoadingError('')
              loadPayments()
            }}
            type="button"
          >
            Try again
          </button>
        </div>
      ) : payments.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600 dark:border-[#2E2A47] dark:bg-[#1A182B] dark:text-slate-300">
          No payment submissions have been received yet.
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-[#2E2A47] dark:bg-[#1A182B]">
          <table className="w-full min-w-[1050px] border-collapse text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-[#181628] dark:text-slate-400">
              <tr>
                <th className="px-4 py-3 font-semibold" scope="col">Student</th>
                <th className="px-4 py-3 font-semibold" scope="col">Selected plan</th>
                <th className="px-4 py-3 font-semibold" scope="col">GCash reference</th>
                <th className="px-4 py-3 font-semibold" scope="col">Receipt</th>
                <th className="px-4 py-3 font-semibold" scope="col">Submitted</th>
                <th className="px-4 py-3 font-semibold" scope="col">Status</th>
                <th className="px-4 py-3 font-semibold" scope="col">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-[#2E2A47]">
              {payments.map((payment) => {
                const status = payment.status
                const statusClassName = statusClasses[status] ||
                  'bg-slate-100 text-slate-700 dark:bg-[#25223A] dark:text-slate-300'

                return (
                  <tr className="text-slate-700 dark:text-slate-200" key={payment.id}>
                    <td className="px-4 py-4">
                      <p className="font-semibold text-slate-900 dark:text-white">{payment.student.name}</p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{payment.student.email}</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-medium">{planLabels[payment.plan_type] || payment.plan_type}</p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {payment.currency} {payment.amount}
                      </p>
                    </td>
                    <td className="px-4 py-4 font-mono text-xs">{payment.reference_number}</td>
                    <td className="px-4 py-4">
                      {payment.receipt_url ? (
                        <button
                          aria-label={`View receipt for ${payment.student.name}`}
                          className="block overflow-hidden rounded-lg border border-slate-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600 dark:border-[#494266]"
                          onClick={() => setSelectedReceipt({
                            name: payment.student.name,
                            url: payment.receipt_url,
                          })}
                          type="button"
                        >
                          <img
                            alt={`GCash receipt submitted by ${payment.student.name}`}
                            className="h-14 w-20 object-cover"
                            loading="lazy"
                            src={payment.receipt_url}
                          />
                        </button>
                      ) : (
                        <span className="text-xs text-slate-500 dark:text-slate-400">No image</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-xs">
                      {new Date(payment.submitted_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusClassName}`}>
                        {statusClasses[status] ? status : 'Unknown'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      {status === 'pending' ? (
                        <div className="flex gap-2">
                          <button
                            className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:cursor-wait disabled:opacity-60"
                            disabled={busyPaymentId !== null}
                            onClick={() => reviewPayment(payment, 'approve')}
                            type="button"
                          >
                            {busyPaymentId === payment.id ? 'Saving…' : 'Approve'}
                          </button>
                          <button
                            className="rounded-lg border border-red-300 px-3 py-2 text-xs font-semibold text-red-700 transition-colors hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:cursor-wait disabled:opacity-60 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/30"
                            disabled={busyPaymentId !== null}
                            onClick={() => reviewPayment(payment, 'decline')}
                            type="button"
                          >
                            Decline
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500 dark:text-slate-400">Reviewed</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {selectedReceipt && createPortal(
        <div
          className="fixed inset-0 z-[11000] flex items-center justify-center bg-slate-950/80 p-4"
          onClick={(event) => {
            if (event.target === event.currentTarget) setSelectedReceipt(null)
          }}
        >
          <section
            aria-label={`Receipt submitted by ${selectedReceipt.name}`}
            aria-modal="true"
            className="relative max-h-[90vh] max-w-4xl rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl dark:border-[#2E2A47] dark:bg-[#1A182B]"
            role="dialog"
          >
            <button
              aria-label="Close receipt preview"
              className="absolute right-3 top-3 rounded-full bg-slate-900/80 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-900"
              onClick={() => setSelectedReceipt(null)}
              type="button"
            >
              Close
            </button>
            <img
              alt={`GCash receipt submitted by ${selectedReceipt.name}`}
              className="max-h-[calc(90vh-1.5rem)] max-w-full rounded-xl object-contain"
              src={selectedReceipt.url}
            />
          </section>
        </div>,
        document.body,
      )}
    </section>
  )
}

export default PaymentApprovals
