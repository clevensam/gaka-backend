export const config = {
  supabase: {
    url: process.env.SUPABASE_URL || '',
    anonKey: process.env.SUPABASE_ANON_KEY || '',
    serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'gaka-dev-secret-change-in-production',
    expiresIn: '7d',
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
  },
  server: {
    port: parseInt(process.env.PORT || '3000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
  },
  rateLimit: {
    windowMs: 15 * 60 * 1000,
    maxRequests: 100,
  },
  cors: {
    origin: process.env.NODE_ENV !== 'production' ? 'http://localhost:5173' : process.env.ALLOWED_ORIGIN || 'https://gakaedu.vercel.app',
  },
} as const;

export const isDev = config.server.nodeEnv !== 'production';
export const isProd = config.server.nodeEnv === 'production';