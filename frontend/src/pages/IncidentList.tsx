import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useSocket } from '../hooks/useSocket';
import { useDebounce } from '../hooks/useDebounce';

const IncidentList = () => {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  
  // Filters
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);
  const [status, setStatus] = useState('');
  const [severity, setSeverity] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Sorting
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const fetchIncidents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.append('search', debouncedSearch);
      if (status) params.append('status', status);
      if (severity) params.append('severity', severity);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      params.append('page', pagination.page.toString());
      params.append('limit', pagination.limit.toString());
      params.append('sortBy', sortBy);
      params.append('sortOrder', sortOrder);
      
      const res = await api.get(`/incidents?${params.toString()}`);
      setIncidents(res.data.data.incidents);
      setPagination(res.data.data.pagination);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch incidents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, [debouncedSearch, status, severity, startDate, endDate, pagination.page, sortBy, sortOrder]);

  const socket = useSocket();
  useEffect(() => {
    if (!socket) return;
    const handleStatusChange = () => fetchIncidents(); 
    socket.on('incident_status_changed', handleStatusChange);
    return () => {
      socket.off('incident_status_changed', handleStatusChange);
    };
  }, [socket]);

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sortBy !== field) return <span className="text-gray-300 ml-1">↕</span>;
    return <span className="text-blue-500 ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>;
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Incidents</h1>
        <Link to="/incidents/new" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 font-medium">
          Create Incident
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6 flex flex-wrap gap-4">
        <input 
          type="text" 
          placeholder="Search by title..." 
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPagination(prev => ({ ...prev, page: 1 }));
          }}
          className="border p-2 rounded flex-1 min-w-[200px]"
        />
        <select value={severity} onChange={(e) => { setSeverity(e.target.value); setPagination(prev => ({ ...prev, page: 1 })); }} className="border p-2 rounded w-40">
          <option value="">All Severities</option>
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
          <option value="Critical">Critical</option>
        </select>
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPagination(prev => ({ ...prev, page: 1 })); }} className="border p-2 rounded w-40">
          <option value="">All Statuses</option>
          <option value="Open">Open</option>
          <option value="In Progress">In Progress</option>
          <option value="Resolved">Resolved</option>
          <option value="Closed">Closed</option>
        </select>
        <input 
          type="date" 
          value={startDate} 
          onChange={(e) => { setStartDate(e.target.value); setPagination(prev => ({ ...prev, page: 1 })); }}
          className="border p-2 rounded" 
          title="Start Date"
        />
        <input 
          type="date" 
          value={endDate} 
          onChange={(e) => { setEndDate(e.target.value); setPagination(prev => ({ ...prev, page: 1 })); }}
          className="border p-2 rounded" 
          title="End Date"
        />
      </div>

      {error && <div className="text-red-500 mb-4">{error}</div>}
      
      {loading ? (
        <div className="text-gray-500">Loading incidents...</div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="p-4 font-medium text-gray-600 cursor-pointer select-none" onClick={() => handleSort('title')}>
                  Title <SortIcon field="title" />
                </th>
                <th className="p-4 font-medium text-gray-600 cursor-pointer select-none" onClick={() => handleSort('severity')}>
                  Severity <SortIcon field="severity" />
                </th>
                <th className="p-4 font-medium text-gray-600 cursor-pointer select-none" onClick={() => handleSort('status')}>
                  Status <SortIcon field="status" />
                </th>
                <th className="p-4 font-medium text-gray-600">Assignee</th>
                <th className="p-4 font-medium text-gray-600 cursor-pointer select-none" onClick={() => handleSort('createdAt')}>
                  Created <SortIcon field="createdAt" />
                </th>
              </tr>
            </thead>
            <tbody>
              {incidents.map((inc) => (
                <tr key={inc._id} className="border-b hover:bg-gray-50">
                  <td className="p-4">
                    <Link to={`/incidents/${inc._id}`} className="text-blue-600 font-medium hover:underline">
                      {inc.title}
                    </Link>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${inc.severity === 'Critical' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                      {inc.severity}
                    </span>
                  </td>
                  <td className="p-4">{inc.status}</td>
                  <td className="p-4">{inc.assignee?.name || 'Unassigned'}</td>
                  <td className="p-4 text-gray-500 text-sm">{new Date(inc.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
              {incidents.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-gray-500">No incidents found</td>
                </tr>
              )}
            </tbody>
          </table>
          
          {/* Pagination Controls */}
          {pagination.pages > 1 && (
            <div className="p-4 border-t bg-gray-50 flex items-center justify-between">
              <span className="text-sm text-gray-600">
                Page {pagination.page} of {pagination.pages} (Total: {pagination.total})
              </span>
              <div className="space-x-2">
                <button 
                  disabled={pagination.page === 1}
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  className="px-3 py-1 border rounded bg-white hover:bg-gray-100 disabled:opacity-50"
                >
                  Previous
                </button>
                <button 
                  disabled={pagination.page === pagination.pages}
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  className="px-3 py-1 border rounded bg-white hover:bg-gray-100 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default IncidentList;
