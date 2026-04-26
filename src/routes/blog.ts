import { Router, Request, Response } from 'express';
import { supabaseAdmin } from '../services/supabase.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import { generateSecureId } from '../services/auth.js';

const router = Router();

interface BlogPost {
  id: string;
  title: string;
  content: string;
  cover_image?: string;
  tags?: string[];
  author_id: string;
  likes_count?: number;
  comments_count?: number;
  created_at: string;
  updated_at?: string;
}

router.get('/posts', async (_req: Request, res: Response) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('blog_posts')
      .select(`
        *,
        author:author_id(id, username, full_name, avatar_url, role),
        comments:blog_comments(count),
        likes:blog_likes(count)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Get posts error:', error);
      return res.status(500).json({ error: { message: 'Failed to fetch posts.' } });
    }

    const posts = (data || []).map((post: any) => ({
      ...post,
      author: post.author ? {
        id: post.author.id,
        username: post.author.username || 'unknown',
        full_name: post.author.full_name || 'Anonymous Author',
        avatar_url: post.author.avatar_url,
        role: post.author.role || 'student',
      } : {
        id: post.author_id,
        username: 'anonymous',
        full_name: 'Anonymous Author',
        avatar_url: null,
        role: 'student',
      },
      likes_count: post.likes?.[0]?.count ?? post.likes_count ?? 0,
      comments_count: post.comments?.[0]?.count ?? post.comments_count ?? 0,
    }));

    res.json({ posts });
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ error: { message: 'Internal server error.' } });
  }
});

router.get('/posts/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from('blog_posts')
      .select(`
        *,
        author:author_id(id, username, full_name, avatar_url, role)
      `)
      .eq('id', id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: { message: 'Post not found.' } });
    }

    const { data: comments } = await supabaseAdmin
      .from('blog_comments')
      .select(`
        *,
        author:author_id(id, full_name, avatar_url)
      `)
      .eq('post_id', id)
      .order('created_at', { ascending: false });

    const { data: likes } = await supabaseAdmin
      .from('blog_likes')
      .select('user_id')
      .eq('post_id', id);

    res.json({
      post: {
        ...data,
        author: data.author ? {
          id: data.author.id,
          username: data.author.username || 'unknown',
          full_name: data.author.full_name || 'Anonymous Author',
          avatar_url: data.author.avatar_url,
          role: data.author.role || 'student',
        } : {
          id: data.author_id,
          username: 'anonymous',
          full_name: 'Anonymous Author',
          avatar_url: null,
          role: 'student',
        },
        comments: comments || [],
        likes_count: likes?.length ?? data.likes_count ?? 0,
      },
    });
  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({ error: { message: 'Internal server error.' } });
  }
});

router.post('/posts', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, content, cover_image, tags } = req.body;
    const user = req.user!;

    if (!title || !content) {
      return res.status(400).json({
        error: { message: 'Title and content are required.' },
      });
    }

    const postId = generateSecureId();

    const { data, error } = await supabaseAdmin
      .from('blog_posts')
      .insert([{
        id: postId,
        title,
        content,
        cover_image: cover_image || null,
        tags: tags || [],
        author_id: user.id,
      }])
      .select()
      .single();

    if (error) {
      console.error('Create post error:', error);
      return res.status(500).json({ error: { message: 'Failed to create post.' } });
    }

    res.status(201).json({ post: data });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ error: { message: 'Internal server error.' } });
  }
});

router.put('/posts/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { title, content, cover_image, tags } = req.body;
    const user = req.user!;

    const { data: existing } = await supabaseAdmin
      .from('blog_posts')
      .select('author_id')
      .eq('id', id)
      .single();

    if (!existing || existing.author_id !== user.id) {
      return res.status(403).json({ error: { message: 'Not authorized.' } });
    }

    const { data, error } = await supabaseAdmin
      .from('blog_posts')
      .update({
        title: title || undefined,
        content: content || undefined,
        cover_image: cover_image !== undefined ? cover_image : undefined,
        tags: tags || undefined,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Update post error:', error);
      return res.status(500).json({ error: { message: 'Failed to update post.' } });
    }

    res.json({ post: data });
  } catch (error) {
    console.error('Update post error:', error);
    res.status(500).json({ error: { message: 'Internal server error.' } });
  }
});

router.delete('/posts/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user!;

    const { data: existing } = await supabaseAdmin
      .from('blog_posts')
      .select('author_id')
      .eq('id', id)
      .single();

    if (!existing || existing.author_id !== user.id) {
      return res.status(403).json({ error: { message: 'Not authorized.' } });
    }

    await supabaseAdmin.from('blog_likes').delete().eq('post_id', id);
    await supabaseAdmin.from('blog_comments').delete().eq('post_id', id);
    await supabaseAdmin.from('blog_posts').delete().eq('id', id);

    res.json({ success: true });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ error: { message: 'Internal server error.' } });
  }
});

export default router;