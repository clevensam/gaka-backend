import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { config, isDev } from './config/env.js';
import authRoutes from './routes/auth.js';
import storageRoutes from './routes/storage.js';
import blogRoutes from './routes/blog.js';
import blogCommentsRoutes from './routes/blogComments.js';
import blogLikesRoutes from './routes/blogLikes.js';
import modulesRoutes from './routes/modules.js';
import resourcesRoutes from './routes/resources.js';
import chatRoutes from './routes/chat.js';
import healthRoutes from './routes/health.js';

const app = express();

app.use(cors({
  origin: isDev ? 'http://localhost:5173' : config.cors.origin,
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));

app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/storage', storageRoutes);
app.use('/api/blog', blogRoutes);
app.use('/api/blog/comments', blogCommentsRoutes);
app.use('/api/blog/likes', blogLikesRoutes);
app.use('/api/modules', modulesRoutes);
app.use('/api/resources', resourcesRoutes);
app.use('/api/chat', chatRoutes);

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: { message: 'Internal Server Error' } });
});

app.listen(config.server.port, () => {
  console.log(`Server running on http://localhost:${config.server.port}`);
});

export default app;