import { Navigate, Outlet, Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../store/store';
import { logout } from '../features/authSlice';
import { useSocket } from '../hooks/useSocket';
import { LogOut, Home, AlertCircle, Settings } from 'lucide-react';

const ProtectedRoute = () => {
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const user = useSelector((state: RootState) => state.auth.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  // Initialize socket connection globally for authenticated users
  useSocket();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <nav className="bg-white border-b px-6 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-6">
          <h1 className="text-xl font-bold text-gray-800">IncidentApp</h1>
          <div className="flex space-x-4">
            <Link to="/dashboard" className="flex items-center text-gray-600 hover:text-gray-900"><Home className="w-4 h-4 mr-1" /> Dashboard</Link>
            <Link to="/incidents" className="flex items-center text-gray-600 hover:text-gray-900"><AlertCircle className="w-4 h-4 mr-1" /> Incidents</Link>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-500">{user?.name}</span>
          <Link to="/settings" className="text-gray-600 hover:text-gray-900"><Settings className="w-4 h-4" /></Link>
          <button onClick={handleLogout} className="text-gray-600 hover:text-red-600 flex items-center">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </nav>
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default ProtectedRoute;
