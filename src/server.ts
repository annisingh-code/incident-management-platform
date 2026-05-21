import http from 'http';
import app from './app';
import { config } from './config';
import { connectDB } from './config/db';
import { initSocket } from './utils/socket';

const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    const server = http.createServer(app);
    
    // Initialize Socket.IO
    initSocket(server);

    server.listen(config.port, () => {
      console.log(`Server is running in ${config.nodeEnv} mode on port ${config.port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
