import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import authService from '../../services/authService';
import toast from 'react-hot-toast';

const VerifyOtp = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState(location.state?.email || '');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!email) {
      toast.error('Email is required for OTP verification');
    }
  }, [email]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return toast.error('Email is required');
    if (!otp || otp.length < 6) return toast.error('Enter a valid 6-digit OTP');

    setLoading(true);
    try {
      await authService.verifyOtp({ email, otp });
      toast.success('Email verified successfully. Please login.');
      navigate('/login', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <ShieldCheck className="h-6 w-6 text-primary-600" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Verify OTP</h2>
      </div>
      <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
        Enter the 6-digit OTP sent to your email.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Email *</label>
          <input
            type="email"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="label">OTP Code *</label>
          <input
            className="input tracking-[0.4em] text-center text-lg font-bold"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="______"
            required
          />
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3">
          {loading ? (
            <span className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            'Verify'
          )}
        </button>
      </form>

      <p className="text-center text-sm text-gray-500 mt-6">
        Already verified?{' '}
        <Link to="/login" className="text-primary-600 font-medium hover:underline">
          Go to Login
        </Link>
      </p>
    </div>
  );
};

export default VerifyOtp;