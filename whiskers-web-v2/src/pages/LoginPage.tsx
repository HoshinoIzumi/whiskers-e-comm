import { useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'

export default function LoginPage() {
  const navigate = useNavigate()

  const login = useAuthStore((s) => s.login)
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  if (user) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold">Already logged in</h1>
        <p className="mt-3 text-stone-600 dark:text-stone-400">
          You’re signed in as <code>{user.email}</code>.
        </p>
        <div className="mt-6">
          <button
            type="button"
            onClick={async () => {
              await logout()
              navigate('/')
            }}
            className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-800 hover:bg-stone-100 dark:border-stone-700 dark:text-stone-100 dark:hover:bg-stone-800"
          >
            Log out
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-2xl font-semibold text-stone-900 dark:text-stone-100">
        Login
      </h1>
      <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
        Sign in to view your order history and access the admin panel.
      </p>

      <form
        className="mt-8 space-y-4"
        onSubmit={async (e) => {
          e.preventDefault()
          setError(null)
          try {
            const u = await login({
              email: email.trim(),
              password,
            })
            if (u.role === 'STAFF' || u.role === 'ADMIN') {
              navigate('/admin')
            } else {
              navigate('/profile')
            }
          } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
              const data = err.response?.data as
                | { message?: unknown; error?: unknown }
                | undefined
              const msg =
                data?.message ?? data?.error ?? err.message
              setError(
                typeof msg === 'string' ? msg : 'Invalid email or password.',
              )
              return
            }
            setError('Could not login. Please try again.')
          }
        }}
      >
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-stone-700 dark:text-stone-300"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-stone-900 shadow-sm dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100"
            required
          />
        </div>
        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-stone-700 dark:text-stone-300"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-stone-900 shadow-sm dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100"
            required
            minLength={8}
          />
        </div>

        {error && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </p>
        )}

        <button
          type="submit"
          className="inline-flex w-full items-center justify-center rounded-lg bg-amber-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-500"
        >
          Login
        </button>
      </form>
    </div>
  )
}
