import { Link } from 'react-router-dom'

function HomePage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-stone-50 px-6 text-stone-800 dark:bg-stone-950 dark:text-stone-100">
      <div className="max-w-md text-center">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-amber-700/90 dark:text-amber-400/90">
          Whiskers
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
          Whiskers V2
        </h1>
        <p className="mt-4 text-base leading-relaxed text-stone-600 dark:text-stone-400">
          React SPA + NestJS + PostgreSQL + Square Sandbox — browse today’s
          menu, checkout as a guest, and pay on Square’s hosted page.
        </p>
        <p className="mt-6 flex flex-wrap justify-center gap-4 text-sm font-medium">
          <Link
            to="/flavours"
            className="rounded-lg bg-amber-600 px-4 py-2.5 text-white shadow-sm hover:bg-amber-500"
          >
            View menu
          </Link>
          <Link
            to="/cart"
            className="rounded-lg border border-stone-300 px-4 py-2.5 text-stone-800 hover:bg-stone-100 dark:border-stone-600 dark:text-stone-100 dark:hover:bg-stone-800"
          >
            Cart
          </Link>
        </p>
      </div>
    </div>
  )
}

export default HomePage
