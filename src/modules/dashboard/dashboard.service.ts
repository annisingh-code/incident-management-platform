import mongoose from 'mongoose';
import { Incident } from '../incident/incident.model';
import { IncidentActivity } from '../incident/incident-activity.model';
import { IncidentStatus } from '../incident/incident.interface';

export const getDashboardMetrics = async (organizationId: string) => {
  const orgId = new mongoose.Types.ObjectId(organizationId);

  // 1. Incident Metrics Aggregation
  const incidentMetrics = await Incident.aggregate([
    // Stage 1: Match incidents only for the current organization
    { $match: { organizationId: orgId } },
    // Stage 2: Facet to run multiple pipelines in parallel on the same documents
    {
      $facet: {
        // Pipeline A: Status Counts (Open vs Closed)
        statusCounts: [
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 },
            },
          },
        ],
        // Pipeline B: Group by Severity
        severityCounts: [
          {
            $group: {
              _id: '$severity',
              count: { $sum: 1 },
            },
          },
        ],
        // Pipeline C: Average Resolution Time (for resolved/closed incidents)
        resolutionTime: [
          {
            $match: {
              status: { $in: [IncidentStatus.RESOLVED, IncidentStatus.CLOSED] },
            },
          },
          {
            $project: {
              // Calculate difference in milliseconds
              timeToResolve: { $subtract: ['$updatedAt', '$createdAt'] },
            },
          },
          {
            $group: {
              _id: null,
              avgTimeMs: { $avg: '$timeToResolve' },
            },
          },
        ],
      },
    },
  ]);

  // 2. Most Active Users Aggregation (from IncidentActivity)
  const mostActiveUsers = await IncidentActivity.aggregate([
    // Stage 1: Match activities for the current organization
    { $match: { organizationId: orgId } },
    // Stage 2: Group by user and count their actions
    {
      $group: {
        _id: '$userId',
        actionCount: { $sum: 1 },
      },
    },
    // Stage 3: Sort by highest action count first
    { $sort: { actionCount: -1 } },
    // Stage 4: Limit to top 5 users
    { $limit: 5 },
    // Stage 5: Lookup (Join) with Users collection to get user details
    {
      $lookup: {
        from: 'users', // Collection name in MongoDB is typically lowercase plural of model
        localField: '_id',
        foreignField: '_id',
        as: 'userDetails',
      },
    },
    // Stage 6: Unwind the array to object
    { $unwind: { path: '$userDetails', preserveNullAndEmptyArrays: true } },
    // Stage 7: Project to format the output nicely
    {
      $project: {
        _id: 1,
        actionCount: 1,
        name: '$userDetails.name',
        email: '$userDetails.email',
      },
    },
  ]);

  // Format the faceted incident metrics output
  const metrics = incidentMetrics[0];

  // Extract counts safely
  const openCount = metrics.statusCounts.find((s: any) => s._id === IncidentStatus.OPEN)?.count || 0;
  const closedCount = metrics.statusCounts.find((s: any) => s._id === IncidentStatus.CLOSED)?.count || 0;
  
  // Format severity map
  const severityBreakdown = metrics.severityCounts.reduce((acc: any, curr: any) => {
    acc[curr._id] = curr.count;
    return acc;
  }, {});

  // Extract average resolution time (convert from ms to hours for readability)
  const avgResolutionMs = metrics.resolutionTime[0]?.avgTimeMs || 0;
  const avgResolutionHours = (avgResolutionMs / (1000 * 60 * 60)).toFixed(2);

  return {
    openIncidents: openCount,
    closedIncidents: closedCount,
    severityBreakdown,
    averageResolutionTimeHours: Number(avgResolutionHours),
    mostActiveUsers,
  };
};
