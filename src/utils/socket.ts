import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { User } from '../modules/user/user.model';
import { Organization } from '../modules/organization/organization.model';
import mongoose from 'mongoose';

let io: Server;

export const initSocket = (server: HttpServer) => {
  io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  // Socket Authentication Middleware
  io.use(async (socket: Socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
      
      if (!token) {
        return next(new Error('Authentication error: Token missing'));
      }

      const decoded = jwt.verify(token, config.jwt.accessSecret) as any;
      const user = await User.findById(decoded.id);
      
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      // Attach user to socket instance
      (socket as any).user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    console.log(`Socket connected: ${socket.id}`);

    socket.on('join_organization', async (data: { organizationId: string }) => {
      try {
        const { organizationId } = data;
        const user = (socket as any).user;

        if (!organizationId || !mongoose.Types.ObjectId.isValid(organizationId)) {
          return socket.emit('error', { message: 'Invalid organizationId' });
        }

        // Verify organization exists
        const org = await Organization.findById(organizationId);
        if (!org) {
          return socket.emit('error', { message: 'Organization not found' });
        }

        // Verify user belongs to organization
        const isMember = user.organizations.some(
          (memberOrg: any) => memberOrg.organization.toString() === organizationId
        );

        if (!isMember) {
          return socket.emit('error', { message: 'You do not belong to this organization' });
        }

        // Leave previous organization rooms if any, then join the new one
        const orgRoom = `org:${organizationId}`;
        Array.from(socket.rooms).forEach(room => {
          if (room.startsWith('org:')) socket.leave(room);
        });

        socket.join(orgRoom);
        socket.emit('joined_organization', { organizationId });
        console.log(`Socket ${socket.id} joined room ${orgRoom}`);
      } catch (error) {
        socket.emit('error', { message: 'Internal server error while joining room' });
      }
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });
};

export const getIO = (): Server => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};
