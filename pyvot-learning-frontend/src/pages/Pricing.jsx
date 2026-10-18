import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import GCashPaymentModal from '../components/GcashPaymentModal.jsx'

const plans = [
  {
    name: 'Free Starter',
    price: '$0',
    billing: 'forever',
    description: 'Start building new skills at your own pace.',
    features: [
      'Access to free courses',
      'Self-paced learning',
      'Track your course progress',
    ],
    action: 'Get Started',
  },
  {
    name: 'Weekly Pass',
    price: '₱199',
    billing: '7 days',
    planType: '1_week',
    description: 'Perfect for a quick sprint or trying out short courses.',
    features: [
      '7-day full course access',
      'Self-paced learning',
      'Course progress tracking',
    ],
    action: 'Select Weekly',
  },
  {
    name: 'Pyvot Pro',
    price: '₱1,599',
    billing: 'per month',
    planType: '1_month',
    description: 'Unlock more learning opportunities with a Pro plan.',
    features: [
      'Access to all courses',
      'Downloadable learning materials',
      'Verified course certificates',
      'Priority learning support',
    ],
    popular: true,
    action: 'Subscribe Now',
  },
  {
    name: 'Lifetime Access',
    price: '₱3,599',
    billing: 'one-time',
    planType: 'lifetime',
    description: 'Make a one-time investment in your learning journey.',
    features: [
      'Lifetime access to all courses',
      'Downloadable learning materials',
      'Verified course certificates',
      'Future course updates',
    ],
    action: 'Subscribe Now',
  },
]

function Pricing() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [selectedPlan, setSelectedPlan] = useState(() =>
    plans.find((item) => item.planType === searchParams.get('plan')) || null,
  )

  useEffect(() => {
    const requestedPlan = searchParams.get('plan')
    if (!requestedPlan) return

    setSearchParams((currentParams) => {
      const nextParams = new URLSearchParams(currentParams)
      nextParams.delete('plan')
      return nextParams
    }, { replace: true })
  }, [searchParams, setSearchParams])

  return (
    <section aria-labelledby="pricing-heading" className="mx-auto max-w-7xl">
      <header className="mx-auto mb-10 max-w-2xl text-center">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-purple-700 dark:text-pink-300">
          Plans for every learner
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl" id="pricing-heading">
          Simple, transparent pricing
        </h1>
        <p className="mt-4 text-base text-slate-600 dark:text-slate-300">
          Choose the plan that fits your learning journey.
        </p>
      </header>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 md:grid-cols-2 lg:grid-cols-4">
        {plans.map((plan) => (
          <article
            aria-label={`${plan.name} plan`}
            className={`relative flex flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg dark:border-[#2E2A47] dark:bg-[#1A182B] dark:shadow-2xl ${
              plan.popular
                ? 'border-purple-300 ring-2 ring-purple-200 dark:ring-pink-500/30'
                : ''
            }`}
            key={plan.name}
          >
            {plan.popular && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-purple-600 px-4 py-1.5 text-xs font-bold text-white dark:bg-pink-600">
                Most Popular
              </span>
            )}
            <div className={plan.popular ? 'pt-2' : ''}>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">{plan.name}</h2>
              <p className="mt-2 min-h-12 text-sm leading-6 text-slate-600 dark:text-slate-300">
                {plan.description}
              </p>
              <p className="mt-6 flex items-baseline gap-2">
                <span className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white">{plan.price}</span>
                <span className="text-sm text-slate-500 dark:text-slate-400">{plan.billing}</span>
              </p>
            </div>

            <ul className="my-7 flex-1 space-y-3">
              {plan.features.map((feature) => (
                <li className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-200" key={feature}>
                  <svg
                    aria-hidden="true"
                    className="mt-0.5 h-5 w-5 shrink-0 text-purple-600 dark:text-pink-400"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path d="m5 12 4 4L19 6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>

            {plan.planType ? (
              <button
                className={`w-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600 ${
                  plan.popular || plan.planType === '1_week' ? 'btn-primary' : 'btn-secondary'
                }`}
                onClick={() => setSelectedPlan(plan)}
                type="button"
              >
                {plan.action}
              </button>
            ) : (
              <Link className="btn-primary w-full" to="/register">
                {plan.action}
              </Link>
            )}
          </article>
        ))}
      </div>

      {selectedPlan?.planType && (
        <GCashPaymentModal onClose={() => setSelectedPlan(null)} plan={selectedPlan} />
      )}

    </section>
  )
}

export default Pricing
