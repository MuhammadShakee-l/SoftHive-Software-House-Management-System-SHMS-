import { useNavigate } from 'react-router-dom';
import { Home, AlertTriangle } from 'lucide-react';

const NotFound = ({ message = "Page not found" }) => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center px-6">
        <div className="flex justify-center mb-6">
          <div className="w-24 h-24 rounded-full bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center">
            <AlertTriangle className="h-12 w-12 text-primary-500" />
          </div>
        </div>
        <h1 className="text-6xl font-extrabold text-gray-900 dark:text-white mb-2">404</h1>
        <p className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-2">{message}</p>
        <p className="text-gray-400 mb-8">The page you are looking for doesn't exist.</p>
        <button onClick={() => navigate('/dashboard')} className="btn-primary mx-auto">
          <Home className="h-4 w-4" /> Back to Dashboard
        </button>
      </div>
    </div>
  );
};

export default NotFound;