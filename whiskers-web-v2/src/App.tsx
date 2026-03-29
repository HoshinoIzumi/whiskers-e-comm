import { Link, Route, Routes } from 'react-router-dom'
import CartPage from './pages/CartPage'
import CheckoutPage from './pages/CheckoutPage'
import CheckoutSuccessPage from './pages/CheckoutSuccessPage'
import FlavoursPage from './pages/FlavoursPage'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'

function App() {
  return (
    <div className="min-h-svh bg-stone-50 dark:bg-stone-950">
      <header className="border-b border-stone-200 bg-white/80 backdrop-blur dark:border-stone-800 dark:bg-stone-900/80">
        <nav className="mx-auto flex max-w-2xl flex-wrap items-center gap-6 px-4 py-3 text-sm font-medium text-stone-700 dark:text-stone-200">
          <Link to="/" className="hover:text-amber-700 dark:hover:text-amber-400">
            Home
          </Link>
          <Link
            to="/flavours"
            className="hover:text-amber-700 dark:hover:text-amber-400"
          >
            Menu
          </Link>
          <Link
            to="/cart"
            className="hover:text-amber-700 dark:hover:text-amber-400"
          >
            Cart
          </Link>
          <Link
            to="/login"
            className="hover:text-amber-700 dark:hover:text-amber-400"
          >
            Login
          </Link>
        </nav>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/flavours" element={<FlavoursPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/checkout/success" element={<CheckoutSuccessPage />} />
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
