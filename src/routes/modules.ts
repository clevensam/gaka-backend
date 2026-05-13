import { Router, Request, Response } from 'express';
import { supabaseAdmin } from '../services/supabase.js';
import { adminMiddleware, AuthenticatedRequest } from '../middleware/auth.js';

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

router.post('/', adminMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { code, name, description, year, semester } = req.body;

    if (!code || !name) {
      return res.status(400).json({ error: { message: 'Code and name are required.' } });
    }

    const { data, error } = await supabaseAdmin
      .from('modules')
      .insert({ code, name, description: description || null, year: year || null, semester: semester || null })
      .select()
      .single();

    if (error) {
      console.error('Create module error:', error);
      return res.status(500).json({ error: { message: 'Failed to create module.' } });
    }

    res.status(201).json({ module: data });
  } catch (error) {
    console.error('Create module error:', error);
    res.status(500).json({ error: { message: 'Internal server error.' } });
  }
});

router.put('/:id', adminMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { code, name, description, year, semester } = req.body;

    const { data, error } = await supabaseAdmin
      .from('modules')
      .update({
        code: code || undefined,
        name: name || undefined,
        description: description !== undefined ? description : undefined,
        year: year !== undefined ? year : undefined,
        semester: semester !== undefined ? semester : undefined,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Update module error:', error);
      return res.status(500).json({ error: { message: 'Failed to update module.' } });
    }

    res.json({ module: data });
  } catch (error) {
    console.error('Update module error:', error);
    res.status(500).json({ error: { message: 'Internal server error.' } });
  }
});

router.delete('/:id', adminMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from('modules')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Delete module error:', error);
      return res.status(500).json({ error: { message: 'Failed to delete module.' } });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Delete module error:', error);
    res.status(500).json({ error: { message: 'Internal server error.' } });
  }
});

export default router;
