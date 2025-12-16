import { Router, Request, Response } from 'express';
import { supabase } from '../lib/supabase';

const router = Router();

// GET /api/looking-for/:user_id - get user's "looking for" items
router.get('/:user_id', async (req: Request, res: Response) => {
  const { user_id } = req.params;

  const { data, error } = await supabase
    .from('LookingFor')
    .select('id, user_id, item_name, created_at')
    .eq('user_id', user_id)
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  return res.json({ items: data ?? [] });
});

// POST /api/looking-for - create a "looking for" item
router.post('/', async (req: Request, res: Response) => {
  const { user_id, item_name } = req.body ?? {};

  if (!user_id || typeof user_id !== 'string') {
    return res.status(400).json({ error: 'user_id (uuid string) is required' });
  }
  if (!item_name || typeof item_name !== 'string') {
    return res.status(400).json({ error: 'item_name (string) is required' });
  }

  const { data, error } = await supabase
    .from('LookingFor')
    .insert([{ user_id, item_name }])
    .select('id, user_id, item_name, created_at')
    .single();

  if (error) return res.status(500).json({ error: error.message });
  return res.status(201).json({ item: data });
});

// DELETE /api/looking-for/:id - delete a "looking for" item
router.delete('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  const { error } = await supabase
    .from('LookingFor')
    .delete()
    .eq('id', id);

  if (error) return res.status(500).json({ error: error.message });
  return res.status(204).send();
});

export default router;
