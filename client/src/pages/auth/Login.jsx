import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { loginUser, resetAuth } from '../../redux/slices/authSlice';

const Login = () => {
  const dispatch   = useDispatch();
  const navigate   = useNavigate();
  const location   = useLocation();
  const { isLoading, isSuccess, isError, user } = useSelector((state) => state.auth);

  const [form, setForm]       = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);

  // Redirect after successful login
  useEffect(() => {
    if (isSuccess && user) {
      dispatch(resetAuth());
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [isSuccess, user]);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(loginUser(form));
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
        Welcome back!
      </h2>
      <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
        Sign in to your SHMS account
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Email Address</label>
          <input
            name="email"
            type="email"
            className="input"
            placeholder="admin@shms.com"
            value={form.email}
            onChange={handleChange}
            required
            autoFocus
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="label mb-0">Password</label>
            <Link
              to="/forgot-password"
              className="text-xs text-primary-600 hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              name="password"
              type={showPass ? 'text' : 'password'}
              className="input pr-10"
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              required
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {isError && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400 text-center">
              Invalid email or password. Please try again.
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary w-full justify-center py-3 mt-2"
        >
          {isLoading ? (
            <span className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <><LogIn className="h-4 w-4" /> Sign In</>
          )}
        </button>
      </form>

      <p className="text-center text-sm text-gray-500 mt-5">
        Don't have an account?{' '}
        <Link to="/register" className="text-primary-600 font-medium hover:underline">
          Create one
        </Link>
      </p>

      {/* Demo credentials box */}
      <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600">
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">
          Demo Credentials
        </p>
        <div className="space-y-1.5">
          {[
            { role: 'Admin',     email: 'admin@shms.com',   pass: 'admin123' },
            { role: 'Manager',   email: 'manager@shms.com', pass: 'admin123' },
            { role: 'Developer', email: 'dev@shms.com',     pass: 'admin123' },
            { role: 'Client',    email: 'client@shms.com',  pass: 'admin123' },
          ].map(({ role, email, pass }) => (
            <button
              key={role}
              type="button"
              onClick={() => setForm({ email, password: pass })}
              className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg
                         hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors group"
            >
              <span className="text-xs font-medium text-gray-600 dark:text-gray-300 group-hover:text-primary-600">
                {role}
              </span>
              <span className="text-xs text-gray-400 font-mono">{email}</span>
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-2 text-center">
          Click a row to auto-fill credentials
        </p>
      </div>
    </div>
  );
};

export default Login;