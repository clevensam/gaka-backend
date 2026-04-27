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
  origin: true,
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));

app.use('/health', healthRoutes);
app.use('/auth', authRoutes);
app.use('/storage', storageRoutes);
app.use('/blog', blogRoutes);
app.use('/blog/comments', blogCommentsRoutes);
app.use('/blog/likes', blogLikesRoutes);
app.use('/modules', modulesRoutes);
app.use('/resources', resourcesRoutes);
app.use('/chat', chatRoutes);

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: { message: 'Internal Server Error' } });
});

app.listen(config.server.port, () => {
  console.log(`Server running on http://localhost:${config.server.port}`);
});

export default app;