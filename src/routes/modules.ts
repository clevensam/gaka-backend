import { Router, Request, Response } from 'express';
import { supabaseAdmin } from '../services/supabase.js';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('modules')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Get modules error:', error);
      return res.status(500).json({ error: { message: 'Failed to fetch modules.' } });
    }

    res.json({ modules: data || [] });
  } catch (error) {
    console.error('Get modules error:', error);
    res.status(500).json({ error: { message: 'Internal server error.' } });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from('modules')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: { message: 'Module not found.' } });
    }

    const { data: resources } = await supabaseAdmin
      .from('resources')
      .select('*')
      .eq('module_id', id)
      .order('created_at', { ascending: false });

    res.json({
      module: data,
      resources: resources || [],
    });
  } catch (error) {
    console.error('Get module error:', error);
    res.status(500).json({ error: { message: 'Internal server error.' } });
  }
});

export default router;