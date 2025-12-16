import { Router, Request, Response } from 'express';
import { supabase } from '../lib/supabase';

const router = Router();

// GET /api/trades - list trades with optional filters
// Query params: limit, offset, offerer_user_id, accepted (true/false), category, trade_options, price_min, price_max, tag, search
router.get('/', async (req: Request, res: Response) => {
  const limit = Math.min(Number(req.query.limit ?? 20), 100);
  const offset = Number(req.query.offset ?? 0);
  const offererUserId = typeof req.query.offerer_user_id === 'string' ? req.query.offerer_user_id : undefined;
  const acceptedParam = typeof req.query.accepted === 'string' ? req.query.accepted : undefined;
  const category = typeof req.query.category === 'string' ? req.query.category : undefined;
  const tradeOptions = typeof req.query.trade_options === 'string' ? req.query.trade_options : undefined;
  const priceMin = typeof req.query.price_min === 'string' ? Number(req.query.price_min) : undefined;
  const priceMax = typeof req.query.price_max === 'string' ? Number(req.query.price_max) : undefined;
  const tag = typeof req.query.tag === 'string' ? req.query.tag : undefined;
  const search = typeof req.query.search === 'string' ? req.query.search.trim() : undefined;

  let query = supabase
    .from('Trades')
    .select('id, offerer_user_id, title, description, price, category, accepted, image_urls, tags, trade_options, created_at');

  if (offererUserId) {
    query = query.eq('offerer_user_id', offererUserId);
  }
  if (acceptedParam === 'true' || acceptedParam === 'false') {
    query = query.eq('accepted', acceptedParam === 'true');
  }
  if (category) {
    query = query.eq('category', category);
  }
  if (tradeOptions) {
    query = query.eq('trade_options', tradeOptions);
  }
  if (priceMin !== undefined && !isNaN(priceMin)) {
    query = query.gte('price', priceMin);
  }
  if (priceMax !== undefined && !isNaN(priceMax)) {
    query = query.lte('price', priceMax);
  }
  if (tag) {
    // Filter by tag if tags array contains the tag
    query = query.contains('tags', [tag]);
  }
  if (search) {
    // Search in title, description, category, or tags (case-insensitive)
    query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,category.ilike.%${search}%,tags.cs.{"${search}"}`);
  }

  query = query.order('id', { ascending: false }).range(offset, offset + limit - 1);

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });

  return res.json({ trades: data ?? [] });
});


// POST /api/trades - create a trade/listing
router.post('/', async (req: Request, res: Response) => {
  const { offerer_user_id, title, description, category, trade_options, price, image_urls, tags } = req.body ?? {};

  // --- Required Fields Validation ---
  if (!offerer_user_id || typeof offerer_user_id !== 'string') {
    return res.status(400).json({ error: 'offerer_user_id (uuid string) is required' });
  }
  if (!title || typeof title !== 'string') {
    return res.status(400).json({ error: 'title (string) is required' });
  }
  if (!description || typeof description !== 'string') {
    return res.status(400).json({ error: 'description (string) is required' });
  }
  if (!trade_options || typeof trade_options !== 'string') {
    return res.status(400).json({ error: 'trade_options (string) is required.' });
  }

  // Validate trade_options (must match listing_type_enum)
  const validTradeOptions = ['Sell', 'Trade', 'Looking for']; 
  if (!validTradeOptions.includes(trade_options)) {
    return res.status(400).json({ error: `trade_options must be one of: ${validTradeOptions.join(', ')}` });
  }

  const tradeData: Record<string, unknown> = {
    offerer_user_id,
    title,
    description,
    trade_options,
    accepted: false
  };

  // --- Optional Fields Validation ---
  
  // category (must match category_enum)
  if (category !== undefined) {
    if (typeof category !== 'string') {
      return res.status(400).json({ error: 'category must be a string when provided' });
    }
    tradeData.category = category;
  }

  // price (required for 'Sell')
  if (trade_options === 'Sell') {
    if (price === undefined || price === null) {
      return res.status(400).json({ error: 'price is required when trade_options is "Sell"' });
    }
    if (typeof price !== 'number' || price < 0) {
      return res.status(400).json({ error: 'price must be a non-negative number' });
    }
    tradeData.price = price;
  } else if (price !== undefined && price !== null) {
    if (typeof price !== 'number' || price < 0) {
      return res.status(400).json({ error: 'price must be a non-negative number when provided' });
    }
    tradeData.price = price;
  }

  // image_urls (jsonb: send array directly)
  if (image_urls !== undefined) {
    if (!Array.isArray(image_urls) || image_urls.some(url => typeof url !== 'string')) {
      return res.status(400).json({ error: 'image_urls must be an array of strings' });
    }
    tradeData.image_urls = image_urls; 
  }

  // tags (jsonb: send array directly)
  if (tags !== undefined) {
    if (!Array.isArray(tags) || tags.some(tag => typeof tag !== 'string')) {
      return res.status(400).json({ error: 'tags must be an array of strings' });
    }
    tradeData.tags = tags; 
  }

  const { data, error } = await supabase
    .from('Trades')
    .insert([tradeData])
    .select('id, offerer_user_id, title, description, price, category, accepted, image_urls, tags, trade_options, created_at') 
    .single();

  if (error) {
    // Check for foreign key constraint violation
    if (error.code === '23503' || error.message?.includes('foreign key')) {
      return res.status(400).json({ error: 'User not found. Please ensure your account is properly set up.' });
    }
    return res.status(500).json({ error: error.message });
  }
  
  if (!data) {
    return res.status(500).json({ error: 'Failed to create trade - no data returned' });
  }
  
  return res.status(201).json({ trade: data });
});

// GET /api/trades/:id - fetch a single trade
router.get('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { data, error } = await supabase
    .from('Trades')
    .select('id, offerer_user_id, title, description, price, category, accepted, image_urls, tags, trade_options, created_at')
    .eq('id', id)
    .single();

  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: 'Trade not found' });
  
  return res.json({ trade: data });
});

// PATCH /api/trades/:id - update trade fields
router.patch('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { description, title, category, price, image_urls, tags, trade_options } = req.body ?? {};

  const update: Record<string, unknown> = {};
  
  // String fields
  if (typeof description === 'string') update.description = description;
  if (typeof title === 'string') update.title = title;
  if (typeof category === 'string') update.category = category;
  
  // ENUM field check
  if (typeof trade_options === 'string') {
    const validTradeOptions = ['Sell', 'Trade', 'Looking for'];
    if (!validTradeOptions.includes(trade_options)) {
      return res.status(400).json({ error: `trade_options must be one of: ${validTradeOptions.join(', ')}` });
    }
    update.trade_options = trade_options; 
  }
  
  // Number fields
  if (typeof price === 'number' && price >= 0) update.price = price;
  
  // Array fields (jsonb: send array directly)
  if (image_urls !== undefined) {
    if (!Array.isArray(image_urls) || image_urls.some(url => typeof url !== 'string')) {
      return res.status(400).json({ error: 'image_urls must be an array of strings' });
    }
    update.image_urls = image_urls;
  }
  
  if (tags !== undefined) {
    if (!Array.isArray(tags) || tags.some(tag => typeof tag !== 'string')) {
      return res.status(400).json({ error: 'tags must be an array of strings' });
    }
    update.tags = tags;
  }
  
  if (Object.keys(update).length === 0) {
    return res.status(400).json({ error: 'Nothing to update' });
  }

  const { data, error } = await supabase
    .from('Trades')
    .update(update)
    .eq('id', id)
    .select('id, offerer_user_id, title, description, price, category, accepted, image_urls, tags, trade_options, created_at')
    .single();

  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: 'Trade not found' });
  
  return res.json({ trade: data });
});

// POST /api/trades/:id/accept - mark as accepted
router.post('/:id/accept', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { data, error } = await supabase
    .from('Trades')
    .update({ accepted: true })
    .eq('id', id)
    .select('id, offerer_user_id, title, description, price, category, accepted, image_urls, tags, trade_options, created_at')
    .single();

  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: 'Trade not found' });
  
  return res.json({ trade: data });
});

// POST /api/trades/:id/cancel - mark as not accepted
router.post('/:id/cancel', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { data, error } = await supabase
    .from('Trades')
    .update({ accepted: false })
    .eq('id', id) 
    .select('id, offerer_user_id, title, description, price, category, accepted, image_urls, tags, trade_options, created_at')
    .single();

  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: 'Trade not found' });
  
  return res.json({ trade: data });
});

// DELETE /api/trades/:id - delete a trade
router.delete('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { error } = await supabase
    .from('Trades')
    .delete()
    .eq('id', id);

  if (error) return res.status(500).json({ error: error.message });
  return res.status(204).send();
});

export default router;
