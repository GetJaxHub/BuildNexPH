import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { AuthProvider } from '@/context/AuthContext';
import ErrorBoundary from '@/components/ErrorBoundary';
import CookieConsent from '@/components/CookieConsent';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SignIn from '@/pages/SignIn';
import SignUp from '@/pages/SignUp';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';

const Home = lazy(() => import('@/pages/Home'));
const Products = lazy(() => import('@/pages/Products'));
const Contractors = lazy(() => import('@/pages/Contractors'));
const ProductDetail = lazy(() => import('@/pages/ProductDetail'));
const ContractorProfile = lazy(() => import('@/pages/ContractorProfile'));
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const NotFound = lazy(() => import('@/pages/NotFound'));
const PrivacyPolicy = lazy(() => import('@/pages/PrivacyPolicy'));
const TermsOfService = lazy(() => import('@/pages/TermsOfService'));
const CookiePolicy = lazy(() => import('@/pages/CookiePolicy'));
const Admin = lazy(() => import('@/pages/Admin'));
const Account = lazy(() => import('@/pages/Account'));
const Messages = lazy(() => import('@/pages/Messages'));

function PageLoader() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <Loader2 size={32} className="animate-spin text-primary-600" />
    </div>
  );
}

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route
              path="*"
              element={
                <Layout>
                  <ErrorBoundary>
                    <Suspense fallback={<PageLoader />}>
                      <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/products" element={<Products />} />
                        <Route path="/products/:id" element={<ProductDetail />} />
                        <Route path="/contractors" element={<Contractors />} />
                        <Route path="/contractors/:id" element={<ContractorProfile />} />
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/account" element={<Account />} />
                        <Route path="/messages" element={<Messages />} />
                        <Route path="/messages/:id" element={<Messages />} />
                        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                        <Route path="/terms-of-service" element={<TermsOfService />} />
                        <Route path="/cookie-policy" element={<CookiePolicy />} />
                        <Route path="/admin" element={<Admin />} />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </Suspense>
                  </ErrorBoundary>
                </Layout>
              }
            />
          </Routes>
          <CookieConsent />
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}
