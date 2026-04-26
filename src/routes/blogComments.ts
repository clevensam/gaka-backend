import { Router, Request, Response } from 'express';
import { supabaseAdmin } from '../services/supabase.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

router.get('/comments/:postId', async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;

    const { data, error } = await supabaseAdmin
      .from('blog_comments')
      .select(`
        *,
        author:author_id(id, full_name, avatar_url)
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Get comments error:', error);
      return res.status(500).json({ error: { message: 'Failed to fetch comments.' } });
    }

    res.json({ comments: data || [] });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ error: { message: 'Internal server error.' } });
  }
});

router.post('/comments', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { post_id, content } = req.body;
    const user = req.user!;

    if (!post_id || !content) {
      return res.status(400).json({
        error: { message: 'Post ID and content are required.' },
      });
    }

    const { generateSecureId } = await import('../services/auth.js');
    const commentId = generateSecureId();

    const { data, error } = await supabaseAdmin
      .from('blog_comments')
      .insert([{
        id: commentId,
        post_id,
        author_id: user.id,
        content,
      }])
      .select()
      .single();

    if (error) {
      console.error('Create comment error:', error);
      return res.status(500).json({ error: { message: 'Failed to create comment.' } });
    }

    await supabaseAdmin.rpc('increment_comments_count', { post_id });

    res.status(201).json({ comment: data });
  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({ error: { message: 'Internal server error.' } });
  }
});

router.delete('/comments/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user!;

    const { data: existing } = await supabaseAdmin
      .from('blog_comments')
      .select('author_id')
      .eq('id', id)
      .single();

    if (!existing || existing.author_id !== user.id) {
      return res.status(403).json({ error: { message: 'Not authorized.' } });
    }

    await supabaseAdmin.from('blog_comments').delete().eq('id', id);

    res.json({ success: true });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ error: { message: 'Internal server error.' } });
  }
});

export default router;