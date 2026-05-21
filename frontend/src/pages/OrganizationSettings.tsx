import { useState } from 'react';
import { useSelector } from 'react-redux';
import { api } from '../services/api';
import type { RootState } from '../store/store';

const OrganizationSettings = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('Developer');
  const [inviting, setInviting] = useState(false);
  const [message, setMessage] = useState('');

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviting(true);
    setMessage('');
    try {
      await api.post('/organizations/invite', { email: inviteEmail, role: inviteRole });
      setMessage('User invited successfully! When they log in or sign up, they will automatically join this organization.');
      setInviteEmail('');
    } catch (err: any) {
      const errorMsg = err.response?.data?.errors 
        ? err.response.data.errors.map((e: any) => e.message).join(', ') 
        : (err.response?.data?.message || 'Failed to invite user');
      setMessage(`Error: ${errorMsg}`);
    } finally {
      setInviting(false);
    }
  };

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Organization Settings</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-xl font-semibold mb-4">Current Organization</h2>
          <p className="text-gray-700 mb-2">ID: <span className="font-mono bg-gray-100 p-1 rounded">{user?.currentOrganization}</span></p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-xl font-semibold mb-4">Invite User</h2>
          <p className="text-sm text-gray-500 mb-4">Invite a teammate to collaborate on your incidents.</p>
          <form onSubmit={handleInvite}>
            <div className="mb-3">
              <input type="email" placeholder="Teammate's Email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} required className="w-full border p-2 rounded" />
            </div>
            <div className="mb-3">
              <select value={inviteRole} onChange={e => setInviteRole(e.target.value)} className="w-full border p-2 rounded">
                <option value="Admin">Admin</option>
                <option value="Manager">Manager</option>
                <option value="Developer">Developer</option>
              </select>
            </div>
            <button disabled={inviting} type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50">
              {inviting ? 'Inviting...' : 'Send Invite'}
            </button>
            {message && <div className={`mt-3 p-2 rounded text-sm ${message.startsWith('Error') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>{message}</div>}
          </form>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h2 className="text-xl font-semibold mb-4">My Memberships</h2>
        <div className="space-y-3">
          {user?.organizations?.map((org: any, idx) => (
            <div key={idx} className="flex justify-between items-center border-b pb-2 last:border-0">
              <span className="font-mono text-sm text-gray-600">{org.organization}</span>
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">{org.role}</span>
            </div>
          ))}
          {(!user?.organizations || user.organizations.length === 0) && (
            <p className="text-gray-500 text-sm">No memberships found.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrganizationSettings;
