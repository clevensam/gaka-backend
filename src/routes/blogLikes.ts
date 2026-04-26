import { Router, Request, Response } from 'express';
import { supabaseAdmin } from '../services/supabase.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

router.post('/toggle', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { post_id } = req.body;
    const user = req.user!;

    if (!post_id) {
      return res.status(400).json({
        error: { message: 'Post ID is required.' },
      });
    }

    const { data: existing } = await supabaseAdmin
      .from('blog_likes')
      .select('id')
      .eq('post_id', post_id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (existing) {
      await supabaseAdmin
        .from('blog_likes')
        .delete()
        .eq('id', existing.id);

      res.json({ liked: false });
    } else {
      const { generateSecureId } = await import('../services/auth.js');
      const likeId = generateSecureId();

      await supabaseAdmin
        .from('blog_likes')
        .insert([{ id: likeId, post_id, user_id: user.id }]);

      res.json({ liked: true });
    }
  } catch (error) {
    console.error('Toggle like error:', error);
    res.status(500).json({ error: { message: 'Internal server error.' } });
  }
});

router.get('/check/:postId', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { postId } = req.params;
    const user = req.user!;

    const { data } = await supabaseAdmin
      .from('blog_likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', user.id)
      .maybeSingle();

    res.json({ liked: !!data });
  } catch (error) {
    console.error('Check like error:', error);
    res.status(500).json({ error: { message: 'Internal server error.' } });
  }
});

export default router;