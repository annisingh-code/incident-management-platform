import { Comment } from './comment.model';
import { Incident } from '../incident/incident.model';
import { createIncidentActivity } from '../incident/incident.service';
import { ApiError } from '../../utils/ApiError';
import { getIO } from '../../utils/socket';
import mongoose from 'mongoose';

const extractMentions = (message: string): string[] => {
  // Parse mentions using @email format
  const mentionRegex = /@([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi;
  const mentions = new Set<string>();
  let match;
  while ((match = mentionRegex.exec(message)) !== null) {
    mentions.add(match[1]);
  }
  return Array.from(mentions);
};

export const createComment = async (
  organizationId: string,
  incidentId: string,
  userId: string,
  message: string
) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Verify incident belongs to organization
    const incident = await Incident.findOne({ _id: incidentId, organizationId }).session(session);
    if (!incident) {
      throw new ApiError(404, 'Incident not found');
    }

    const mentions = extractMentions(message);

    const comment = new Comment({
      incidentId,
      organizationId,
      userId,
      message,
      mentions,
    });

    await comment.save({ session });

    // Populate user details so socket and API responses have the name
    const populatedComment = await Comment.findById(comment._id).populate('userId', 'name email').session(session);

    // Automatically create IncidentActivity entry
    await createIncidentActivity(
      organizationId,
      incidentId,
      userId,
      'COMMENT_ADDED',
      undefined,
      comment.id,
      session
    );

    await session.commitTransaction();
    session.endSession();
    
    // Emit real-time event
    try {
      getIO().to(`org:${organizationId}`).emit('new_comment', {
        incidentId,
        comment: populatedComment,
      });
    } catch (err) {
      console.error('Socket emit failed:', err);
    }
    
    return populatedComment;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

export const getCommentsByIncident = async (organizationId: string, query: any) => {
  const { incidentId, page = 1, limit = 10 } = query;

  // Verify incident belongs to organization
  const incident = await Incident.findOne({ _id: incidentId, organizationId });
  if (!incident) {
    throw new ApiError(404, 'Incident not found');
  }

  const skip = (Number(page) - 1) * Number(limit);

  const comments = await Comment.find({ incidentId, organizationId })
    .sort({ createdAt: -1 }) // Latest comments first
    .skip(skip)
    .limit(Number(limit))
    .populate('userId', 'name email');

  const total = await Comment.countDocuments({ incidentId, organizationId });

  return {
    comments,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit)),
    },
  };
};
