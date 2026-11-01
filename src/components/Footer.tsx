import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin } from 'lucide-react';
import { openCookiePreferences } from '@/components/CookieConsent';

export default function Footer() {
  return (
    <footer className="bg-neutral-900 text-neutral-400 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <img src="/image.png" alt="BuildNexPH" className="w-9 h-9 rounded-lg object-cover" />
              <span className="font-display font-extrabold text-lg text-white">
                BuildNex<span className="text-primary-500">PH</span>
              </span>
            </div>
            <p className="text-sm leading-relaxed">
              The Philippines' exclusive B2B marketplace for accredited contractors and construction materials.
            </p>
          </div>

          <div>
            <h4 className="text-white font-semibold text-sm mb-3">Marketplace</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/" className="hover:text-white transition-colors">Browse Products</Link></li>
              <li><Link to="/contractors" className="hover:text-white transition-colors">Find Contractors</Link></li>
              <li><Link to="/products" className="hover:text-white transition-colors">All Products</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold text-sm mb-3">For Contractors</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/signup" className="hover:text-white transition-colors">Register Company</Link></li>
              <li><Link to="/dashboard" className="hover:text-white transition-colors">Contractor Dashboard</Link></li>
              <li><Link to="/signin" className="hover:text-white transition-colors">Sign In</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold text-sm mb-3">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms-of-service" className="hover:text-white transition-colors">Terms of Service</Link></li>
              <li><Link to="/cookie-policy" className="hover:text-white transition-colors">Cookie Policy</Link></li>
              <li>
                <button onClick={openCookiePreferences} className="hover:text-white transition-colors text-left">
                  Cookie Preferences
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold text-sm mb-3">Contact</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2"><Mail size={14} /> info@buildnex.ph</li>
              <li className="flex items-center gap-2"><Phone size={14} /> +63 2 8888 1234</li>
              <li className="flex items-center gap-2"><MapPin size={14} /> Makati City, Metro Manila</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-neutral-800 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <p>&copy; {new Date().getFullYear()} BuildNexPH. All rights reserved. Built for Filipino contractors.</p>
          <div className="flex items-center gap-4">
            <Link to="/privacy-policy" className="hover:text-white transition-colors">Privacy</Link>
            <Link to="/terms-of-service" className="hover:text-white transition-colors">Terms</Link>
            <Link to="/cookie-policy" className="hover:text-white transition-colors">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
