import { Router, Request, Response } from 'express';
import { supabase } from '../lib/supabase';

const router = Router();

// POST /api/offers - create an offer for a trade
router.post('/', async (req: Request, res: Response) => {
  const { trade_id, offerer_user_id, message, price } = req.body ?? {};

  if (!trade_id || typeof trade_id !== 'string') {
    return res.status(400).json({ error: 'trade_id (uuid string) is required' });
  }
  if (!offerer_user_id || typeof offerer_user_id !== 'string') {
    return res.status(400).json({ error: 'offerer_user_id (uuid string) is required' });
  }

  const insertData: Record<string, unknown> = { trade_id, offerer_user_id };
  if (typeof message === 'string') insertData.message = message;
  if (typeof price === 'number') insertData.price = price;

  const { data, error } = await supabase
    .from('Offers')
    .insert([insertData])
    .select('id, trade_id, offerer_user_id, message, price, status, created_at')
    .single();

  if (error) return res.status(500).json({ error: error.message });
  return res.status(201).json({ offer: data });
});

// GET /api/offers - list offers with filters
router.get('/', async (req: Request, res: Response) => {
  const limit = Math.min(Number(req.query.limit ?? 20), 100);
  const offset = Number(req.query.offset ?? 0);
  const tradeId = typeof req.query.trade_id === 'string' ? req.query.trade_id : undefined;
  const offererUserId = typeof req.query.offerer_user_id === 'string' ? req.query.offerer_user_id : undefined;

  let query = supabase
    .from('Offers')
    .select('id, trade_id, offerer_user_id, message, price, status, created_at')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (tradeId) {
    query = query.eq('trade_id', tradeId);
  }
  if (offererUserId) {
    query = query.eq('offerer_user_id', offererUserId);
  }

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  return res.json({ offers: data ?? [] });
});

// PATCH /api/offers/:id - update offer status (accept/reject)
router.patch('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body ?? {};

  if (typeof status !== 'string' || !['pending', 'accepted', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'status must be one of: pending, accepted, rejected' });
  }

  const { data, error } = await supabase
    .from('Offers')
    .update({ status })
    .eq('id', id)
    .select('id, trade_id, offerer_user_id, message, price, status, created_at')
    .single();

  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: 'Offer not found' });
  return res.json({ offer: data });
});

export default router;
