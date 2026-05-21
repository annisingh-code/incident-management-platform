import { Incident } from './incident.model';
import { IncidentActivity } from './incident-activity.model';
import { ApiError } from '../../utils/ApiError';
import { getIO } from '../../utils/socket';
import mongoose from 'mongoose';

export const createIncidentActivity = async (
  organizationId: string,
  incidentId: string,
  userId: string,
  actionType: string,
  oldValue?: string,
  newValue?: string,
  session?: mongoose.ClientSession
) => {
  const activity = new IncidentActivity({
    organizationId,
    incidentId,
    userId,
    actionType,
    oldValue,
    newValue,
  });
  
  if (session) {
    return activity.save({ session });
  }
  return activity.save();
};

export const createIncident = async (organizationId: string, userId: string, incidentData: any) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const incident = new Incident({
      ...incidentData,
      organizationId,
      reporter: userId,
    });
    
    await incident.save({ session });
    
    await createIncidentActivity(
      organizationId, 
      incident.id, 
      userId, 
      'CREATED', 
      undefined, 
      undefined, 
      session
    );
    
    await session.commitTransaction();
    session.endSession();
    return incident;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

export const getIncidentById = async (organizationId: string, incidentId: string) => {
  const incident = await Incident.findOne({ _id: incidentId, organizationId })
    .populate('assignee', 'name email')
    .populate('reporter', 'name email');
    
  if (!incident) {
    throw new ApiError(404, 'Incident not found');
  }
  return incident;
};

export const getAllIncidents = async (organizationId: string, query: any) => {
  const {
    page = 1,
    limit = 10,
    search,
    severity,
    status,
    assignee,
    startDate,
    endDate,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = query;

  const filter: any = { organizationId };

  if (search) {
    filter.title = { $regex: search, $options: 'i' };
  }
  if (severity) filter.severity = severity;
  if (status) filter.status = status;
  if (assignee) filter.assignee = assignee;

  if (startDate || endDate) {
    filter.dueDate = {};
    if (startDate) filter.dueDate.$gte = new Date(startDate);
    if (endDate) filter.dueDate.$lte = new Date(endDate);
  }

  const sort: any = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  const skip = (Number(page) - 1) * Number(limit);

  const incidents = await Incident.find(filter)
    .sort(sort)
    .skip(skip)
    .limit(Number(limit))
    .populate('assignee', 'name email')
    .populate('reporter', 'name email');

  const total = await Incident.countDocuments(filter);

  return {
    incidents,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit)),
    },
  };
};

export const updateIncident = async (organizationId: string, incidentId: string, userId: string, updateData: any) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const incident = await Incident.findOne({ _id: incidentId, organizationId }).session(session);
    if (!incident) {
      throw new ApiError(404, 'Incident not found');
    }

    const changes = [];
    
    if (updateData.status && updateData.status !== incident.status) {
      changes.push({ type: 'STATUS_CHANGED', old: incident.status, new: updateData.status });
      incident.status = updateData.status;
    }
    
    if (updateData.severity && updateData.severity !== incident.severity) {
      changes.push({ type: 'SEVERITY_CHANGED', old: incident.severity, new: updateData.severity });
      incident.severity = updateData.severity;
    }
    
    if (updateData.assignee && updateData.assignee !== incident.assignee?.toString()) {
      changes.push({ type: 'ASSIGNEE_CHANGED', old: incident.assignee?.toString(), new: updateData.assignee });
      incident.assignee = updateData.assignee;
    }

    // Update other fields
    if (updateData.title) incident.title = updateData.title;
    if (updateData.description) incident.description = updateData.description;
    if (updateData.tags) incident.tags = updateData.tags;
    if (updateData.dueDate) incident.dueDate = updateData.dueDate;

    await incident.save({ session });

    // Log activities
    for (const change of changes) {
      await createIncidentActivity(
        organizationId,
        incident.id,
        userId,
        change.type,
        change.old,
        change.new,
        session
      );
    }

    await session.commitTransaction();
    session.endSession();

    // Emit real-time events
    try {
      const io = getIO();
      const orgRoom = `org:${organizationId}`;
      
      for (const change of changes) {
        if (change.type === 'STATUS_CHANGED') {
          io.to(orgRoom).emit('incident_status_changed', {
            incidentId,
            oldStatus: change.old,
            newStatus: change.new,
            updatedBy: userId
          });
        }
        if (change.type === 'SEVERITY_CHANGED') {
          io.to(orgRoom).emit('incident_severity_changed', {
            incidentId,
            oldSeverity: change.old,
            newSeverity: change.new,
            updatedBy: userId
          });
        }
        if (change.type === 'ASSIGNEE_CHANGED') {
          io.to(orgRoom).emit('incident_assignee_changed', {
            incidentId,
            oldAssignee: change.old,
            newAssignee: change.new,
            updatedBy: userId
          });
        }
      }
    } catch (err) {
      console.error('Socket emit failed:', err);
    }

    return incident;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

export const deleteIncident = async (organizationId: string, incidentId: string) => {
  const incident = await Incident.findOneAndDelete({ _id: incidentId, organizationId });
  if (!incident) {
    throw new ApiError(404, 'Incident not found');
  }
  
  // Optionally delete activities
  await IncidentActivity.deleteMany({ incidentId });
  
  return incident;
};

export const getIncidentActivities = async (organizationId: string, incidentId: string) => {
  const activities = await IncidentActivity.find({ organizationId, incidentId })
    .sort({ createdAt: -1 }) // Sort latest first
    .populate('userId', 'name email');
    
  return activities;
};
