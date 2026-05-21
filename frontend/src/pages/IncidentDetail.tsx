import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { useSocket } from '../hooks/useSocket';

const IncidentDetail = () => {
  const { id } = useParams();
  const [incident, setIncident] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [commenting, setCommenting] = useState(false);

  const fetchIncidentData = async () => {
    try {
      setLoading(true);
      const [incRes, actRes, comRes] = await Promise.all([
        api.get(`/incidents/${id}`),
        api.get(`/incidents/${id}/activities`),
        api.get(`/comments?incidentId=${id}&limit=50`)
      ]);
      setIncident(incRes.data.data);
      setActivities(actRes.data.data);
      setComments(comRes.data.data.comments);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch incident details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidentData();
  }, [id]);

  const socket = useSocket();
  useEffect(() => {
    if (!socket) return;
    
    const handleNewComment = (data: { incidentId: string, comment: any }) => {
      if (data.incidentId === id) {
        setComments(prev => {
          if (prev.find(c => c._id === data.comment._id)) return prev;
          return [data.comment, ...prev];
        });
      }
    };

    const handleStatusChange = (data: { incidentId: string, newStatus: string }) => {
      console.log('Status changed socket event:', data);
      if (data.incidentId === id) {
        // Optimistically update the status badge
        if (data.newStatus) {
          setIncident((prev: any) => prev ? { ...prev, status: data.newStatus } : prev);
        }
        // Background refresh activities timeline without causing a loading screen
        api.get(`/incidents/${id}/activities`).then(res => setActivities(res.data.data)).catch(console.error);
      }
    };

    const handleSeverityChange = (data: { incidentId: string, newSeverity: string }) => {
      console.log('Severity changed socket event:', data);
      if (data.incidentId === id) {
        if (data.newSeverity) {
          setIncident((prev: any) => prev ? { ...prev, severity: data.newSeverity } : prev);
        }
        api.get(`/incidents/${id}/activities`).then(res => setActivities(res.data.data)).catch(console.error);
      }
    };

    const handleAssigneeChange = (data: { incidentId: string }) => {
      console.log('Assignee changed socket event:', data);
      if (data.incidentId === id) {
        // Background refresh to get new assignee name and activities
        api.get(`/incidents/${id}`).then(res => setIncident(res.data.data)).catch(console.error);
        api.get(`/incidents/${id}/activities`).then(res => setActivities(res.data.data)).catch(console.error);
      }
    };

    socket.on('new_comment', handleNewComment);
    socket.on('incident_status_changed', handleStatusChange);
    socket.on('incident_severity_changed', handleSeverityChange);
    socket.on('incident_assignee_changed', handleAssigneeChange);

    return () => {
      socket.off('new_comment', handleNewComment);
      socket.off('incident_status_changed', handleStatusChange);
      socket.off('incident_severity_changed', handleSeverityChange);
      socket.off('incident_assignee_changed', handleAssigneeChange);
    };
  }, [socket, id]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    
    setCommenting(true);
    try {
      const res = await api.post('/comments', { incidentId: id, message: newComment });
      setNewComment('');
      setComments(prev => {
        if (prev.find(c => c._id === res.data.data._id)) return prev;
        return [res.data.data, ...prev];
      });
    } catch (err) {
      console.error('Failed to add comment', err);
    } finally {
      setCommenting(false);
    }
  };

  if (loading) return <div className="p-8 text-gray-500">Loading incident details...</div>;
  if (error) return <div className="p-8 text-red-500">Error: {error}</div>;
  if (!incident) return null;

  return (
    <div className="p-8 max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
      {/* Left Column: Details & Comments */}
      <div className="md:col-span-2 space-y-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex justify-between items-start mb-4">
            <h1 className="text-2xl font-bold">{incident.title}</h1>
            <Link to={`/incidents/${id}/edit`} className="text-blue-600 text-sm hover:underline">Edit</Link>
          </div>
          <div className="flex space-x-3 mb-6">
            <span className={`px-2 py-1 rounded text-xs font-medium ${incident.severity === 'Critical' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
              {incident.severity}
            </span>
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
              {incident.status}
            </span>
          </div>
          <p className="text-gray-700 whitespace-pre-wrap">{incident.description}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-xl font-bold mb-4">Comments</h2>
          <form onSubmit={handleAddComment} className="mb-6">
            <textarea 
              className="w-full border rounded p-3 mb-2 focus:ring focus:ring-blue-200 outline-none"
              rows={3}
              placeholder="Add a comment... (use @email to mention)"
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              disabled={commenting}
            />
            <button type="submit" disabled={commenting} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50">
              {commenting ? 'Posting...' : 'Post Comment'}
            </button>
          </form>
          
          <div className="space-y-4">
            {comments.map(comment => (
              <div key={comment._id} className="border-b pb-4 last:border-0">
                <p className="text-sm font-medium text-gray-800 mb-1">
                  {comment.userId?.name || comment.userId} <span className="text-gray-400 font-normal ml-2">{new Date(comment.createdAt).toLocaleString()}</span>
                </p>
                <p className="text-gray-700">{comment.message}</p>
              </div>
            ))}
            {comments.length === 0 && <p className="text-gray-500 text-sm">No comments yet.</p>}
          </div>
        </div>
      </div>

      {/* Right Column: Activity Timeline */}
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-lg font-bold mb-4">Activity Timeline</h2>
          <div className="space-y-4 relative before:absolute before:inset-0 before:ml-4 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
            {activities.map(act => (
              <div key={act._id} className="relative flex items-start pl-10">
                {/* Timeline Dot */}
                <div className="absolute left-4 -translate-x-1/2 top-4 w-3 h-3 bg-blue-500 rounded-full border-2 border-white shadow"></div>
                
                <div className="bg-gray-50 border p-3 rounded shadow-sm w-full">
                  <p className="text-sm font-medium text-gray-800">{act.actionType.replace(/_/g, ' ')}</p>
                  <p className="text-xs text-gray-500 mb-1">{new Date(act.createdAt).toLocaleString()}</p>
                  {act.oldValue && act.newValue && (
                    <p className="text-xs text-gray-600">{act.oldValue} → {act.newValue}</p>
                  )}
                </div>
              </div>
            ))}
            {activities.length === 0 && <p className="text-gray-500 text-sm pl-10">No activity recorded.</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default IncidentDetail;
