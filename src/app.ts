import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import { errorHandler } from './middleware/error.middleware';
import { notFoundHandler } from './middleware/notFound.middleware';
import { HealthRoutes } from './modules/health/health.route';
import { AuthRoutes } from './modules/auth/auth.route';
import { OrganizationRoutes } from './modules/organization/organization.route';
import { IncidentRoutes } from './modules/incident/incident.route';
import { CommentRoutes } from './modules/comment/comment.route';
import { DashboardRoutes } from './modules/dashboard/dashboard.route';

const app: Application = express();

// Security Middleware
app.use(helmet());
app.use(
  cors({
    origin: '*', // Adjust this in production
    credentials: true,
  })
);

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Increased limit to 1000 for testing purposes
  standardHeaders: true, 
  legacyHeaders: false, 
});
app.use(limiter);

// Body Parsing Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/v1/health', HealthRoutes);
app.use('/api/v1/auth', AuthRoutes);
app.use('/api/v1/organizations', OrganizationRoutes);
app.use('/api/v1/incidents', IncidentRoutes);
app.use('/api/v1/comments', CommentRoutes);
app.use('/api/v1/dashboard', DashboardRoutes);

// Base Route
app.get('/', (req: Request, res: Response) => {
  res.send('Welcome to the Backend API');
});

// Handle 404
app.use(notFoundHandler);

// Global Error Handler
app.use(errorHandler);

export default app;
