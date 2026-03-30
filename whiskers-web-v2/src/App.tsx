import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, Route, Routes, useLocation } from 'react-router-dom'
import { getMe } from './lib/api'
import { useAuthStore } from './stores/authStore'
import CartPage from './pages/CartPage'
import CheckoutPage from './pages/CheckoutPage'
import CheckoutSuccessPage from './pages/CheckoutSuccessPage'
import TodayMenuPage from './pages/TodayMenuPage'
import FlavoursPage from './pages/FlavoursPage'
import FlavourDetailsPage from './pages/FlavourDetailsPage'
import HomePage from './pages/HomePage'
import AboutPage from './pages/AboutPage'
import LoginPage from './pages/LoginPage'
import OrdersPage from './pages/OrdersPage'
import ProfilePage from './pages/ProfilePage'
import AdminPage from './pages/AdminPage'
import AuthGate from './components/AuthGate'
import { useNavigate } from 'react-router-dom'

function App() {
  const location = useLocation()
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

  const currentLang =
    location.pathname.startsWith('/zh') ? 'zh' : location.pathname.startsWith('/en') ? 'en' : null
  const prefix = currentLang ? `/${currentLang}` : ''

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
    <div className="min-h-svh bg-background text-foreground">
      <header className="border-b border-border bg-white/70 backdrop-blur">
        <nav className="mx-auto flex max-w-2xl flex-wrap items-center gap-6 px-4 py-3 text-sm font-medium text-foreground/90">
          <Link to={currentLang ? `${prefix}` : '/'} className="hover:text-gelato-blue">
            Home
          </Link>
          <Link
            to={currentLang ? `${prefix}/today` : '/today'}
            className="rounded-full px-3 py-1 hover:bg-gelato-blue/10 hover:text-gelato-blue"
          >
            Today
          </Link>
          <Link
            to={currentLang ? `${prefix}/flavours` : '/flavours'}
            className="rounded-full px-3 py-1 hover:bg-gelato-blue/10 hover:text-gelato-blue"
          >
            Flavours
          </Link>
          <Link
            to={currentLang ? `${prefix}/cart` : '/cart'}
            className="rounded-full px-3 py-1 hover:bg-gelato-blue/10 hover:text-gelato-blue"
          >
            Cart
          </Link>
          {user ? (
            <>
              <Link
                to={currentLang ? `${prefix}/orders` : '/orders'}
                className="rounded-full px-3 py-1 hover:bg-gelato-blue/10 hover:text-gelato-blue"
              >
                Orders
              </Link>
              <Link
                to={currentLang ? `${prefix}/profile` : '/profile'}
                className="rounded-full px-3 py-1 hover:bg-gelato-blue/10 hover:text-gelato-blue"
              >
                Profile
              </Link>
              {(user.role === 'STAFF' || user.role === 'ADMIN') && (
                <Link
                  to={currentLang ? `${prefix}/admin` : '/admin'}
                  className="rounded-full px-3 py-1 hover:bg-gelato-blue/10 hover:text-gelato-blue"
                >
                  Admin
                </Link>
              )}
              <button
                type="button"
                onClick={async () => {
                  await logout()
                  navigate(currentLang ? `${prefix}` : '/')
                }}
                className="rounded-full px-3 py-1 hover:bg-gelato-blue/10 hover:text-gelato-blue"
              >
                Logout
              </button>
            </>
          ) : (
            <Link
              to={currentLang ? `${prefix}/login` : '/login'}
              className="rounded-full px-3 py-1 hover:bg-gelato-blue/10 hover:text-gelato-blue"
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
            <Route path="/en" element={<HomePage />} />
            <Route path="/zh" element={<HomePage />} />
            <Route path="/en/about" element={<AboutPage />} />
            <Route path="/zh/about" element={<AboutPage />} />
            <Route path="/en/today" element={<TodayMenuPage />} />
            <Route path="/zh/today" element={<TodayMenuPage />} />
            <Route path="/en/flavours" element={<FlavoursPage />} />
            <Route path="/zh/flavours" element={<FlavoursPage />} />
            <Route path="/en/flavours/:id" element={<FlavourDetailsPage />} />
            <Route path="/zh/flavours/:id" element={<FlavourDetailsPage />} />
            <Route path="/en/cart" element={<CartPage />} />
            <Route path="/zh/cart" element={<CartPage />} />
            <Route path="/en/checkout" element={<CheckoutPage />} />
            <Route path="/zh/checkout" element={<CheckoutPage />} />
            <Route path="/en/checkout/success" element={<CheckoutSuccessPage />} />
            <Route path="/zh/checkout/success" element={<CheckoutSuccessPage />} />
            <Route path="/en/login" element={<LoginPage />} />
            <Route
              path="/en/orders"
              element={
                <AuthGate>
                  <OrdersPage />
                </AuthGate>
              }
            />
            <Route
              path="/zh/orders"
              element={
                <AuthGate>
                  <OrdersPage />
                </AuthGate>
              }
            />
            <Route
              path="/en/profile"
              element={
                <AuthGate>
                  <ProfilePage />
                </AuthGate>
              }
            />
            <Route
              path="/zh/profile"
              element={
                <AuthGate>
                  <ProfilePage />
                </AuthGate>
              }
            />
            <Route
              path="/en/admin"
              element={
                <AuthGate roles={['STAFF', 'ADMIN']}>
                  <AdminPage />
                </AuthGate>
              }
            />
            <Route
              path="/zh/admin"
              element={
                <AuthGate roles={['STAFF', 'ADMIN']}>
                  <AdminPage />
                </AuthGate>
              }
            />
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
