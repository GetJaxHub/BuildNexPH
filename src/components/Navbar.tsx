import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { LogOut, LayoutDashboard, Menu, MessageSquare, UserRound, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function Navbar() {
  const { user, accountType, signOut } = useAuth();
  const home = accountType === 'buyer'
    ? { path: '/account', label: 'My Account', Icon: UserRound }
    : { path: '/dashboard', label: 'Dashboard', Icon: LayoutDashboard };
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const navLinks = [
    { label: 'Marketplace', path: '/' },
    { label: 'Contractors', path: '/contractors' },
    { label: 'Products', path: '/products' },
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2 group">
              <img src="/image.png" alt="BuildNexPH" className="w-9 h-9 rounded-lg object-cover" />
              <span className="font-display font-extrabold text-lg text-neutral-900 hidden sm:block">
                BuildNex<span className="text-primary-600">PH</span>
              </span>
            </Link>
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive(link.path)
                      ? 'text-primary-700 bg-primary-50'
                      : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <Link to="/messages" className="btn-ghost !py-2">
                  <MessageSquare size={16} />
                  Messages
                </Link>
                <Link to={home.path} className="btn-secondary !py-2">
                  <home.Icon size={16} />
                  {home.label}
                </Link>
                <button onClick={handleSignOut} className="btn-ghost !py-2">
                  <LogOut size={16} />
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link to="/signin" className="btn-secondary !py-2">
                  Sign In
                </Link>
                <Link to="/signup" className="btn-primary !py-2">
                  Register
                </Link>
              </>
            )}
          </div>

          <button
            className="md:hidden p-2 rounded-lg hover:bg-neutral-100"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-neutral-200 bg-white animate-slide-down">
          <div className="px-4 py-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileOpen(false)}
                className={`block px-3 py-2 rounded-lg text-sm font-medium ${
                  isActive(link.path)
                    ? 'text-primary-700 bg-primary-50'
                    : 'text-neutral-600 hover:bg-neutral-100'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-2 border-t border-neutral-200 space-y-1">
              {user ? (
                <>
                  <Link
                    to="/messages"
                    onClick={() => setMobileOpen(false)}
                    className="block px-3 py-2 rounded-lg text-sm font-medium text-neutral-600 hover:bg-neutral-100"
                  >
                    Messages
                  </Link>
                  <Link
                    to={home.path}
                    onClick={() => setMobileOpen(false)}
                    className="block px-3 py-2 rounded-lg text-sm font-medium text-neutral-600 hover:bg-neutral-100"
                  >
                    {home.label}
                  </Link>
                  <button
                    onClick={() => {
                      setMobileOpen(false);
                      handleSignOut();
                    }}
                    className="block w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-neutral-600 hover:bg-neutral-100"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/signin"
                    onClick={() => setMobileOpen(false)}
                    className="block px-3 py-2 rounded-lg text-sm font-medium text-neutral-600 hover:bg-neutral-100"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/signup"
                    onClick={() => setMobileOpen(false)}
                    className="block px-3 py-2 rounded-lg text-sm font-medium text-primary-600 hover:bg-primary-50"
                  >
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
