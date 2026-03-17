import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import authService from '../../services/authService';
import toast from 'react-hot-toast';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authService.forgotPassword(email);
      setSent(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  if (sent) return (
    <div className="text-center">
      <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Check Your Email</h2>
      <p className="text-gray-500 text-sm mb-6">We sent a password reset link to <strong>{email}</strong></p>
      <Link to="/login" className="btn-primary mx-auto w-fit"><ArrowLeft className="h-4 w-4" /> Back to Login</Link>
    </div>
  );

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Forgot Password?</h2>
      <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">Enter your email and we'll send a reset link</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Email Address</label>
          <input type="email" className="input" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3">
          {loading ? <span className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Mail className="h-4 w-4" /> Send Reset Link</>}
        </button>
      </form>

      <p className="text-center mt-4">
        <Link to="/login" className="text-sm text-primary-600 hover:underline flex items-center gap-1 justify-center">
          <ArrowLeft className="h-3 w-3" /> Back to Login
        </Link>
      </p>
    </div>
  );
};

export default ForgotPassword;