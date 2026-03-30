import { useAuthStore } from '../stores/authStore'

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center text-sm text-stone-600 dark:text-stone-400">
        Loading…
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-stone-900 dark:text-stone-100">
          Profile
        </h1>
        <button
          type="button"
          onClick={async () => {
            await logout()
            window.location.assign('/')
          }}
          className="rounded-lg border border-stone-300 px-3 py-2 text-sm font-medium text-stone-800 hover:bg-stone-100 dark:border-stone-700 dark:text-stone-100 dark:hover:bg-stone-800"
        >
          Log out
        </button>
      </div>

      <div className="mt-6 rounded-lg border border-stone-200 p-4 dark:border-stone-700">
        <dl className="grid gap-x-4 gap-y-2 sm:grid-cols-2">
          <dt className="text-sm font-medium text-stone-600 dark:text-stone-400">
            Email
          </dt>
          <dd className="text-sm text-stone-900 dark:text-stone-100">
            {user.email}
          </dd>

          <dt className="text-sm font-medium text-stone-600 dark:text-stone-400">
            Role
          </dt>
          <dd className="text-sm text-stone-900 dark:text-stone-100">
            {user.role}
          </dd>

          <dt className="text-sm font-medium text-stone-600 dark:text-stone-400">
            Active
          </dt>
          <dd className="text-sm text-stone-900 dark:text-stone-100">
            {user.isActive ? 'Yes' : 'No'}
          </dd>

          <dt className="text-sm font-medium text-stone-600 dark:text-stone-400">
            Phone
          </dt>
          <dd className="text-sm text-stone-900 dark:text-stone-100">
            {user.profile?.phone ?? '—'}
          </dd>

          <dt className="text-sm font-medium text-stone-600 dark:text-stone-400">
            Address
          </dt>
          <dd className="text-sm text-stone-900 dark:text-stone-100">
            {user.profile?.address ?? '—'}
          </dd>
        </dl>
      </div>
    </div>
  )
}

