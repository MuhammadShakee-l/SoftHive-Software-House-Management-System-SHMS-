import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../redux/slices/authSlice';
import { useNavigate } from 'react-router-dom';

const useAuth = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, token, isLoading } = useSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const isAdmin = user?.role === 'admin';
  const isManager = user?.role === 'manager';
  const isDeveloper = user?.role === 'developer';
  const isClient = user?.role === 'client';
  const isAdminOrManager = isAdmin || isManager;

  return { user, token, isLoading, isAdmin, isManager, isDeveloper, isClient, isAdminOrManager, handleLogout };
};

export default useAuth;