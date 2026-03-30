import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, Route, Routes } from 'react-router-dom'
import { getMe } from './lib/api'
import { useAuthStore } from './stores/authStore'
import CartPage from './pages/CartPage'
import CheckoutPage from './pages/CheckoutPage'
import CheckoutSuccessPage from './pages/CheckoutSuccessPage'
import TodayMenuPage from './pages/TodayMenuPage'
import FlavoursPage from './pages/FlavoursPage'
import FlavourDetailsPage from './pages/FlavourDetailsPage'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import OrdersPage from './pages/OrdersPage'
import ProfilePage from './pages/ProfilePage'
import AdminPage from './pages/AdminPage'
import AuthGate from './components/AuthGate'
import { useNavigate } from 'react-router-dom'

function App() {
  const navigate = useNavigate()

  const accessToken = useAuthStore((s) => s.accessToken)
  const refreshToken = useAuthStore((s) => s.refreshToken)
  const user = useAuthStore((s) => s.user)
  const setSession = useAuthStore((s) => s.setSession)
  const clearSession = useAuthStore((s) => s.clearSession)
  const logout = useAuthStore((s) => s.logout)

  const authMe = useQuery({
    queryKey: ['auth-me'],
    queryFn: getMe,
    enabled: !!accessToken && !user,
    retry: false,
  })

  const isHydrating = !!accessToken && !user && authMe.isPending

  useEffect(() => {
    if (!authMe.data) return
    if (!accessToken) return
    setSession(authMe.data, accessToken, refreshToken)
  }, [authMe.data, accessToken, refreshToken, setSession])

  useEffect(() => {
    if (!authMe.isError) return
    clearSession()
  }, [authMe.isError, clearSession])

  return (
    <div className="min-h-svh bg-stone-50 dark:bg-stone-950">
      <header className="border-b border-stone-200 bg-white/80 backdrop-blur dark:border-stone-800 dark:bg-stone-900/80">
        <nav className="mx-auto flex max-w-2xl flex-wrap items-center gap-6 px-4 py-3 text-sm font-medium text-stone-700 dark:text-stone-200">
          <Link to="/" className="hover:text-amber-700 dark:hover:text-amber-400">
            Home
          </Link>
          <Link
            to="/today"
            className="hover:text-amber-700 dark:hover:text-amber-400"
          >
            Today
          </Link>
          <Link
            to="/flavours"
            className="hover:text-amber-700 dark:hover:text-amber-400"
          >
            Flavours
          </Link>
          <Link
            to="/cart"
            className="hover:text-amber-700 dark:hover:text-amber-400"
          >
            Cart
          </Link>
          {user ? (
            <>
              <Link
                to="/orders"
                className="hover:text-amber-700 dark:hover:text-amber-400"
              >
                Orders
              </Link>
              <Link
                to="/profile"
                className="hover:text-amber-700 dark:hover:text-amber-400"
              >
                Profile
              </Link>
              {(user.role === 'STAFF' || user.role === 'ADMIN') && (
                <Link
                  to="/admin"
                  className="hover:text-amber-700 dark:hover:text-amber-400"
                >
                  Admin
                </Link>
              )}
              <button
                type="button"
                onClick={async () => {
                  await logout()
                  navigate('/')
                }}
                className="hover:text-amber-700 dark:hover:text-amber-400"
              >
                Logout
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="hover:text-amber-700 dark:hover:text-amber-400"
            >
              Login
            </Link>
          )}
        </nav>
      </header>
      <main>
        {isHydrating ? (
          <div className="mx-auto max-w-xl px-4 py-16 text-center text-sm text-stone-500">
            Loading…
          </div>
        ) : (
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/today" element={<TodayMenuPage />} />
            <Route path="/flavours" element={<FlavoursPage />} />
            <Route path="/flavours/:id" element={<FlavourDetailsPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/checkout/success" element={<CheckoutSuccessPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/orders"
              element={
                <AuthGate>
                  <OrdersPage />
                </AuthGate>
              }
            />
            <Route
              path="/profile"
              element={
                <AuthGate>
                  <ProfilePage />
                </AuthGate>
              }
            />
            <Route
              path="/admin"
              element={
                <AuthGate roles={['STAFF', 'ADMIN']}>
                  <AdminPage />
                </AuthGate>
              }
            />
          </Routes>
        )}
      </main>
    </div>
  )
}

export default App
