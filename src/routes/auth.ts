import { Router, Request, Response } from 'express';
import { supabaseAdmin } from '../services/supabase.js';
import { generateToken, hashPassword, verifyPassword, generateSecureId } from '../services/auth.js';

const router = Router();

interface RegisterBody {
  username: string;
  password: string;
  fullName: string;
  email: string;
  avatarUrl?: string;
}

interface LoginBody {
  username: string;
  password: string;
}

router.post('/register', async (req: Request, res: Response) => {
  try {
    const { username, password, fullName, email, avatarUrl } = req.body as RegisterBody;

    if (!username || !password || !fullName || !email) {
      return res.status(400).json({
        error: { message: 'Username, password, fullName, and email are required.' },
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: { message: 'Password must be at least 6 characters.' },
      });
    }

    const { data: existing } = await supabaseAdmin
      .from('portal_users')
      .select('id')
      .eq('username', username)
      .maybeSingle();

    if (existing) {
      return res.status(400).json({
        error: { message: 'Username is already taken.' },
      });
    }

    const passwordHash = await hashPassword(password);
    const userId = generateSecureId();

    const { data, error } = await supabaseAdmin
      .from('portal_users')
      .insert([{
        id: userId,
        username,
        password_hash: passwordHash,
        full_name: fullName,
        email,
        role: 'student',
        avatar_url: avatarUrl || null,
      }])
      .select()
      .single();

    if (error) {
      console.error('Register error:', error);
      return res.status(500).json({
        error: { message: 'Failed to create user.' },
      });
    }

    const token = generateToken({
      id: data.id,
      username: data.username,
      role: data.role,
    });

    const { password_hash, password: _, ...userWithoutPassword } = data;

    res.status(201).json({
      user: userWithoutPassword,
      token,
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      error: { message: 'Internal server error.' },
    });
  }
});

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body as LoginBody;

    if (!username || !password) {
      return res.status(400).json({
        error: { message: 'Username and password are required.' },
      });
    }

    const { data: user, error } = await supabaseAdmin
      .from('portal_users')
      .select('*')
      .eq('username', username)
      .single();

    if (error || !user) {
      return res.status(401).json({
        error: { message: 'Invalid username or password.' },
      });
    }

    let isValidPassword = false;
    
    if (user.password_hash) {
      isValidPassword = await verifyPassword(password, user.password_hash);
    } else if (user.password) {
      isValidPassword = user.password === password;
    }

    if (!isValidPassword) {
      return res.status(401).json({
        error: { message: 'Invalid username or password.' },
      });
    }

    const token = generateToken({
      id: user.id,
      username: user.username,
      role: user.role,
    });

    const { password_hash, password: _, ...userWithoutPassword } = user;

    res.json({
      user: userWithoutPassword,
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: { message: 'Internal server error.' },
    });
  }
});

router.get('/me', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: { message: 'No token provided.' },
      });
    }

    const token = authHeader.substring(7);
    const { verifyToken } = await import('../services/auth.js');
    const payload = (verifyToken as (t: string) => { id: string; username: string; role: string })(token);

    const { data: user, error } = await supabaseAdmin
      .from('portal_users')
      .select('*')
      .eq('id', payload.id)
      .single();

    if (error || !user) {
      return res.status(401).json({
        error: { message: 'User not found.' },
      });
    }

    const { password_hash, password: _, ...userWithoutPassword } = user;

    res.json({ user: userWithoutPassword });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(401).json({
      error: { message: 'Invalid token.' },
    });
  }
});

export default router;