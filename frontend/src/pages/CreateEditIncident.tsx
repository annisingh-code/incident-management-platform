import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';

const CreateEditIncident = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState('Low');
  const [status, setStatus] = useState('Open');
  const [tags, setTags] = useState('');
  const [assignee, setAssignee] = useState('');
  const [dueDate, setDueDate] = useState('');
  
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Fetch org users for the assignee dropdown
    api.get('/organizations/users').then(res => {
      setUsers(res.data.data);
    }).catch(console.error);

    if (isEditing) {
      api.get(`/incidents/${id}`)
        .then(res => {
          const inc = res.data.data;
          setTitle(inc.title);
          setDescription(inc.description);
          setSeverity(inc.severity);
          setStatus(inc.status);
          setTags(inc.tags?.join(', ') || '');
          setAssignee(inc.assignee?._id || '');
          if (inc.dueDate) {
            setDueDate(new Date(inc.dueDate).toISOString().split('T')[0]);
          }
          setLoading(false);
        })
        .catch(() => {
          setError('Failed to load incident details');
          setLoading(false);
        });
    }
  }, [id, isEditing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    const payload: any = {
      title,
      description,
      severity,
      status,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean)
    };
    
    if (assignee) payload.assignee = assignee;
    if (dueDate) payload.dueDate = dueDate;

    try {
      if (isEditing) {
        await api.put(`/incidents/${id}`, payload);
        navigate(`/incidents/${id}`);
      } else {
        const res = await api.post('/incidents', payload);
        navigate(`/incidents/${res.data.data._id}`);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save incident');
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-gray-500">Loading form...</div>;

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">{isEditing ? 'Edit Incident' : 'Create Incident'}</h1>
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-sm border">
        {error && <div className="bg-red-50 text-red-500 p-3 rounded mb-4 text-sm">{error}</div>}
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Title</label>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)} required className="w-full border p-2 rounded" />
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} required rows={4} className="w-full border p-2 rounded"></textarea>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">Severity</label>
            <select value={severity} onChange={e => setSeverity(e.target.value)} className="w-full border p-2 rounded">
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </div>
          {isEditing && (
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select value={status} onChange={e => setStatus(e.target.value)} className="w-full border p-2 rounded">
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
                <option value="Closed">Closed</option>
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-1">Assignee</label>
            <select value={assignee} onChange={e => setAssignee(e.target.value)} className="w-full border p-2 rounded">
              <option value="">Unassigned</option>
              {users.map(u => (
                <option key={u._id} value={u._id}>{u.name} ({u.email})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Due Date</label>
            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full border p-2 rounded" />
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-1">Tags (comma separated)</label>
          <input type="text" value={tags} onChange={e => setTags(e.target.value)} className="w-full border p-2 rounded" placeholder="e.g. database, production" />
        </div>

        <div className="flex justify-end space-x-3">
          <button type="button" onClick={() => navigate(-1)} className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-50">Cancel</button>
          <button type="submit" disabled={saving} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Incident'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateEditIncident;
