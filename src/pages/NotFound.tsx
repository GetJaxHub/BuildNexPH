import { Link } from 'react-router-dom';
import { Home, Package } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
      <div className="text-7xl font-display font-extrabold text-primary-600 mb-2">404</div>
      <h1 className="text-xl font-bold text-neutral-900 mb-2">Page Not Found</h1>
      <p className="text-sm text-neutral-500 mb-6">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <div className="flex items-center justify-center gap-3">
        <Link to="/" className="btn-primary">
          <Home size={16} /> Go Home
        </Link>
        <Link to="/products" className="btn-secondary">
          <Package size={16} /> Browse Products
        </Link>
      </div>
    </div>
  );
}
