import { useEffect } from 'react'
import { HashRouter, Route, Routes, useLocation } from 'react-router-dom'
import { DemoBar, Navbar, Footer, Breadcrumbs } from './components/layout'
import { ErrorBoundary } from './components/ErrorBoundary'
import { Toasts } from './components/ui'
import { useUI } from './store/ui'
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import Login from './pages/auth/Login'
import Signup from './pages/auth/Signup'
import ForgotPassword from './pages/auth/ForgotPassword'
import ResetPassword from './pages/auth/ResetPassword'
import { RequireAuth } from './components/RequireAuth'
import { useAuth } from './store/auth'
import NotFound from './pages/NotFound'
import PlansPage from './pages/invest/Plans'
import StocksPage from './pages/invest/Stocks'
import StockDetail from './pages/invest/StockDetail'
import CryptoPage from './pages/invest/Crypto'
import CryptoDetail from './pages/invest/CryptoDetail'
import RealEstatePage from './pages/invest/RealEstate'
import PropertyDetail from './pages/invest/PropertyDetail'
import PortfolioPage from './pages/invest/Portfolio'
import VehiclesPage from './pages/vehicles/Vehicles'
import VehicleDetail from './pages/vehicles/VehicleDetail'
import MembershipPage from './pages/membership/Membership'
import MyMembership from './pages/membership/MyMembership'
import VipPage from './pages/membership/Vip'
import MyVip from './pages/membership/MyVip'
import GiveawaysPage from './pages/membership/Giveaways'
import DemoTrading from './pages/trading/DemoTrading'
import LiveMarkets from './pages/trading/LiveMarkets'
import CopyTrading from './pages/trading/CopyTrading'
import AiBot from './pages/trading/AiBot'
import ManagedAccounts from './pages/trading/ManagedAccounts'
import Deposit from './pages/wallet/Deposit'
import Withdraw from './pages/wallet/Withdraw'
import Transfer from './pages/wallet/Transfer'
import Swap from './pages/wallet/Swap'
import History from './pages/wallet/History'
import ConnectWallet from './pages/wallet/ConnectWallet'
import Profile from './pages/account/Profile'
import Verify from './pages/account/Verify'
import Security from './pages/account/Security'
import Notifications from './pages/account/Notifications'
import Support from './pages/account/Support'
import AdminGate from './pages/admin/AdminGate'
import AdminLayout, { RequireAdmin } from './components/AdminLayout'
import AdminDashboard from './pages/admin/Dashboard'
import AdminUsers from './pages/admin/Users'
import AdminAssets from './pages/admin/Assets'
import AdminPlans from './pages/admin/Plans'
import AdminVehicles from './pages/admin/Vehicles'
import AdminTransactions from './pages/admin/Transactions'
import AdminGiveaways from './pages/admin/Giveaways'
import AdminSettings from './pages/admin/Settings'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

function Shell() {
  const { theme } = useUI()
  const { pathname } = useLocation()
  const init = useAuth((s) => s.init)
  useEffect(() => {
    init()
  }, [init])
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])
  const overlay = pathname === '/'
  return (
    <div className="min-h-screen bg-paper dark:bg-ink text-ink dark:text-paper flex flex-col">
      <DemoBar />
      <Navbar overlay={overlay} />
      <ScrollToTop />
      <Breadcrumbs />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
          <Route path="/invest/plans" element={<PlansPage />} />
          <Route path="/invest/stocks" element={<StocksPage />} />
          <Route path="/invest/stocks/:symbol" element={<StockDetail />} />
          <Route path="/invest/crypto" element={<CryptoPage />} />
          <Route path="/invest/crypto/:symbol" element={<CryptoDetail />} />
          <Route path="/invest/real-estate" element={<RealEstatePage />} />
          <Route path="/invest/real-estate/:id" element={<PropertyDetail />} />
          <Route path="/invest/portfolio" element={<PortfolioPage />} />
          <Route path="/vehicles" element={<VehiclesPage />} />
          <Route path="/vehicles/:id" element={<VehicleDetail />} />
          <Route path="/membership" element={<MembershipPage />} />
          <Route path="/membership/my" element={<MyMembership />} />
          <Route path="/membership/vip" element={<VipPage />} />
          <Route path="/membership/vip/my" element={<MyVip />} />
          <Route path="/membership/giveaways" element={<GiveawaysPage />} />
          <Route path="/trading/demo" element={<DemoTrading />} />
          <Route path="/trading/live" element={<LiveMarkets />} />
          <Route path="/trading/live/:symbol" element={<LiveMarkets />} />
          <Route path="/trading/copy" element={<CopyTrading />} />
          <Route path="/trading/bot" element={<AiBot />} />
          <Route path="/trading/managed" element={<ManagedAccounts />} />
          <Route path="/wallet/deposit" element={<Deposit />} />
          <Route path="/wallet/withdraw" element={<Withdraw />} />
          <Route path="/wallet/transfer" element={<Transfer />} />
          <Route path="/wallet/swap" element={<Swap />} />
          <Route path="/wallet/history" element={<History />} />
          <Route path="/wallet/connect" element={<ConnectWallet />} />
          <Route path="/account/profile" element={<Profile />} />
          <Route path="/account/verify" element={<Verify />} />
          <Route path="/account/security" element={<Security />} />
          <Route path="/account/notifications" element={<Notifications />} />
          <Route path="/account/support" element={<Support />} />
          <Route path="/admin/login" element={<AdminGate />} />
          <Route
            path="/admin"
            element={
              <RequireAdmin>
                <AdminLayout />
              </RequireAdmin>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="assets" element={<AdminAssets />} />
            <Route path="plans" element={<AdminPlans />} />
            <Route path="vehicles" element={<AdminVehicles />} />
            <Route path="transactions" element={<AdminTransactions />} />
            <Route path="giveaways" element={<AdminGiveaways />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
      <Toasts />
    </div>
  )
}

export default function App() {
  // useTransitions={false}: apply hash-route location updates synchronously.
  // The ErrorBoundary surfaces any render crash visibly instead of a blank page.
  return (
    <ErrorBoundary>
      <HashRouter useTransitions={false}>
        <Shell />
      </HashRouter>
    </ErrorBoundary>
  )
}
