import { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { api } from "../services/api";
import { updateUser } from "../features/authSlice";
import type { RootState } from "../store/store";

interface DashboardMetrics {
  openIncidents: number;
  closedIncidents: number;
  severityBreakdown: Record<string, number>;
  averageResolutionTimeHours: number;
  mostActiveUsers: any[];
}

const Dashboard = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [orgName, setOrgName] = useState("");
  const [creatingOrg, setCreatingOrg] = useState(false);

  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);

  const fetchMetrics = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/dashboard");
      setMetrics(res.data.data);
      setError("");
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Failed to fetch dashboard metrics",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim()) return;

    setCreatingOrg(true);
    try {
      const res = await api.post("/organizations", { name: orgName });
      const newOrgId = res.data.data._id;

      // Update Redux state so sockets and layouts detect the new org
      if (user) {
        dispatch(
          updateUser({
            ...user,
            currentOrganization: newOrgId,
            organizations: [
              ...(user.organizations || []),
              { organization: newOrgId, role: "Admin" },
            ],
          }),
        );
      }

      // Immediately try to fetch metrics again now that user has an org context
      // (Backend will use the access token. However, wait! Does the backend extract currentOrganization from the token or DB?)
      // The backend extracts user from DB using the ID in the token, so the updated DB user will have the new org context!
      await fetchMetrics();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to create organization");
    } finally {
      setCreatingOrg(false);
    }
  };

  if (error && error.includes("Organization context required")) {
    return (
      <div className="p-8 max-w-lg mx-auto mt-12">
        <div className="bg-white p-8 rounded-lg shadow-md border text-center">
          <div className="bg-blue-50 text-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              ></path>
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-2">Welcome to IncidentApp!</h2>
          <p className="text-gray-600 mb-6">
            To get started, please create your first organization workspace.
          </p>

          <form onSubmit={handleCreateOrg}>
            <input
              type="text"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              placeholder="e.g. Acme Corp"
              required
              className="w-full border p-3 rounded mb-4 focus:ring focus:ring-blue-200 outline-none"
            />
            <button
              disabled={creatingOrg}
              type="submit"
              className="w-full bg-blue-600 text-white py-3 rounded hover:bg-blue-700 font-medium disabled:opacity-50 transition-colors"
            >
              {creatingOrg ? "Creating Workspace..." : "Create Organization"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (loading)
    return <div className="p-8 text-gray-500">Loading dashboard...</div>;
  if (error) return <div className="p-8 text-red-500">Error: {error}</div>;
  if (!metrics) return null;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-gray-500 mb-2 font-medium">Open Incidents</h3>
          <p className="text-4xl font-bold text-gray-800">
            {metrics.openIncidents}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-gray-500 mb-2 font-medium">Closed Incidents</h3>
          <p className="text-4xl font-bold text-gray-800">
            {metrics.closedIncidents}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-gray-500 mb-2 font-medium">Avg Resolution</h3>
          <p className="text-4xl font-bold text-gray-800">
            {metrics.averageResolutionTimeHours} hrs
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-xl font-bold mb-4">Severity Breakdown</h3>
          <div className="space-y-3">
            {Object.entries(metrics.severityBreakdown).map(
              ([severity, count]) => (
                <div
                  key={severity}
                  className="flex justify-between items-center"
                >
                  <span className="text-gray-700">{severity}</span>
                  <span className="bg-gray-100 px-3 py-1 rounded-full text-sm font-medium">
                    {count}
                  </span>
                </div>
              ),
            )}
            {Object.keys(metrics.severityBreakdown).length === 0 && (
              <p className="text-gray-500 text-sm">No incidents available</p>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-xl font-bold mb-4">Most Active Users</h3>
          <div className="space-y-4">
            {metrics.mostActiveUsers.map((user, idx) => (
              <div
                key={user._id || idx}
                className="flex items-center justify-between"
              >
                <div>
                  <p className="font-medium text-gray-800">{user.name}</p>
                  <p className="text-sm text-gray-500">{user.email}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-800">
                    {user.actionCount}
                  </p>
                  <p className="text-xs text-gray-500">actions</p>
                </div>
              </div>
            ))}
            {metrics.mostActiveUsers.length === 0 && (
              <p className="text-gray-500 text-sm">No recent activity</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
