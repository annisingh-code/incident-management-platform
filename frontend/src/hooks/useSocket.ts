import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSelector } from 'react-redux';
import type { RootState } from '../store/store';

export const useSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const { user, accessToken, isAuthenticated } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    // Connect if authenticated and we have a token
    if (isAuthenticated && accessToken) {
      const newSocket = io(import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:5000', {
        auth: { token: accessToken }
      });

      setSocket(newSocket);

      newSocket.on('connect', () => {
        console.log('Socket connected');
        
        // Join organization room when connected
        if (user?.currentOrganization) {
          newSocket.emit('join_organization', { organizationId: user.currentOrganization });
        }
      });

      newSocket.on('joined_organization', (data) => {
        console.log('Successfully joined org room:', data);
      });

      newSocket.on('error', (err) => {
        console.error('Socket error:', err);
      });

      // Cleanup on unmount or token change
      return () => {
        newSocket.disconnect();
      };
    }
  }, [isAuthenticated, accessToken, user?.currentOrganization]); // Re-run if org changes

  return socket;
};
