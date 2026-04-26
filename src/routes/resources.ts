import { Router, Request, Response } from 'express';
import { supabaseAdmin } from '../services/supabase.js';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const { module_id } = req.query;

    let query = supabaseAdmin
      .from('resources')
      .select('*')
      .order('created_at', { ascending: false });

    if (module_id) {
      query = query.eq('module_id', module_id as string);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Get resources error:', error);
      return res.status(500).json({ error: { message: 'Failed to fetch resources.' } });
    }

    res.json({ resources: data || [] });
  } catch (error) {
    console.error('Get resources error:', error);
    res.status(500).json({ error: { message: 'Internal server error.' } });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from('resources')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: { message: 'Resource not found.' } });
    }

    res.json({ resource: data });
  } catch (error) {
    console.error('Get resource error:', error);
    res.status(500).json({ error: { message: 'Internal server error.' } });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { title, type, view_url, download_url, module_id } = req.body;

    if (!title || !type || !module_id) {
      return res.status(400).json({ error: { message: 'Title, type, and module_id are required.' } });
    }

    const { data, error } = await supabaseAdmin
      .from('resources')
      .insert({ title, type, view_url, download_url, module_id })
      .select()
      .single();

    if (error) {
      console.error('Create resource error:', error);
      return res.status(500).json({ error: { message: 'Failed to create resource.' } });
    }

    res.status(201).json({ resource: data });
  } catch (error) {
    console.error('Create resource error:', error);
    res.status(500).json({ error: { message: 'Internal server error.' } });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, type, view_url, download_url, module_id } = req.body;

    const { data, error } = await supabaseAdmin
      .from('resources')
      .update({ title, type, view_url, download_url, module_id })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Update resource error:', error);
      return res.status(500).json({ error: { message: 'Failed to update resource.' } });
    }

    res.json({ resource: data });
  } catch (error) {
    console.error('Update resource error:', error);
    res.status(500).json({ error: { message: 'Internal server error.' } });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from('resources')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Delete resource error:', error);
      return res.status(500).json({ error: { message: 'Failed to delete resource.' } });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Delete resource error:', error);
    res.status(500).json({ error: { message: 'Internal server error.' } });
  }
});

export default router;