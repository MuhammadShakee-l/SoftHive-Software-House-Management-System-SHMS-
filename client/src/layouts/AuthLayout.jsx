import { Outlet, Navigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import Logo from '../components/common/Logo';

const AuthLayout = () => {
  const { token, user } = useSelector((state) => state.auth);

  if (token && user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 via-primary-700 to-indigo-800 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 26 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-8 flex flex-col items-center">
          <Link to="/" className="inline-flex">
            <div className="bg-white/15 backdrop-blur rounded-2xl p-3 shadow-lg">
              <Logo size={44} showText={false} />
            </div>
          </Link>
          <h1 className="text-3xl font-extrabold text-white tracking-tight mt-4">SoftHive</h1>
          <p className="text-primary-200 mt-1 text-sm">Software House Management System</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8">
          <Outlet />
        </div>

        <p className="text-center text-primary-200 text-xs mt-6">
          © {new Date().getFullYear()} SoftHive. All rights reserved.
        </p>
      </motion.div>
    </div>
  );
};

export default AuthLayout;