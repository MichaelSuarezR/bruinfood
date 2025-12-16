import { Router, Request, Response } from 'express';
import { supabase } from '../lib/supabase';

const router = Router();

const normalizeStringArray = (input: unknown): string[] => {
  if (Array.isArray(input)) {
    return input
      .map((item) => (typeof item === 'string' ? item : String(item ?? '')).trim())
      .filter((value) => value.length > 0);
  }

  if (typeof input === 'string') {
    return input
      .split(',')
      .map((value) => value.trim())
      .filter((value) => value.length > 0);
  }

  return [];
};

// GET /api/users - list users with optional search
router.get('/', async (req: Request, res: Response) => {
  const limit = Math.min(Number(req.query.limit ?? 20), 100);
  const offset = Number(req.query.offset ?? 0);
  const search = typeof req.query.search === 'string' ? req.query.search : undefined;

  let query = supabase
    .from('users')
    .select('id, email, user_name, created_at, bio, rating, profile_picture_url, trade_preferences, category_preferences, interests')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (search) {
    query = query.or(`user_name.ilike.%${search}%,email.ilike.%${search}%`);
  }

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  return res.json({ users: data ?? [] });
});

// POST /api/users - create a new user
router.post('/', async (req: Request, res: Response) => {
  const { id, email, user_name, bio, profile_picture_url, trade_preferences, category_preferences, interests } = req.body ?? {};

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'id (uuid string) is required' });
  }
  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'email (string) is required' });
  }

  // Normalize email to lowercase and trim whitespace
  const normalizedEmail = email.toLowerCase().trim();

  const insertData: Record<string, unknown> = { id, email: normalizedEmail };
  if (typeof user_name === 'string') insertData.user_name = user_name;
  if (typeof bio === 'string') insertData.bio = bio;
  if (typeof profile_picture_url === 'string') insertData.profile_picture_url = profile_picture_url;

  if (trade_preferences !== undefined) {
    insertData.trade_preferences = normalizeStringArray(trade_preferences);
  }
  if (category_preferences !== undefined) {
    insertData.category_preferences = normalizeStringArray(category_preferences);
  }
  if (interests !== undefined) {
    insertData.interests = normalizeStringArray(interests);
  }

  const { data, error } = await supabase
    .from('users')
    .insert([insertData])
    .select('id, email, user_name, created_at, bio, rating, profile_picture_url, trade_preferences, category_preferences, interests')
    .single();

  if (error) {
    // If user already exists, return existing user
    if (error.code === '23505') { // Unique violation
      // Check if it's an email constraint violation
      const isEmailConstraint = error.message?.includes('users_email_key') || error.message?.includes('email');
      
      // Try to find existing user by email first (most common case)
      if (isEmailConstraint) {
        const { data: existingUserByEmail } = await supabase
          .from('users')
          .select('id, email, user_name, created_at, bio, rating, profile_picture_url, trade_preferences, category_preferences, interests')
          .eq('email', normalizedEmail)
          .single();
        if (existingUserByEmail) {
          return res.json({ user: existingUserByEmail });
        }
      }
      
      // Fallback: try to find by id
      const { data: existingUserById } = await supabase
        .from('users')
        .select('id, email, user_name, created_at, bio, rating, profile_picture_url, trade_preferences, category_preferences, interests')
        .eq('id', id)
        .single();
      if (existingUserById) {
        return res.json({ user: existingUserById });
      }
    }
    return res.status(500).json({ error: error.message });
  }
  return res.status(201).json({ user: data });
});

// GET /api/users/:id - fetch single user by id
router.get('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from('users')
    .select('id, email, user_name, created_at, bio, rating, profile_picture_url, trade_preferences, category_preferences, interests')
    .eq('id', id)
    .single();

  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: 'User not found' });
  return res.json({ user: data });
});

// PATCH /api/users/:id - update user profile
router.patch('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { user_name, email, bio, profile_picture_url, trade_preferences, category_preferences, interests } = req.body ?? {};

  const update: Record<string, unknown> = {};
  if (typeof user_name === 'string') update.user_name = user_name;
  if (typeof email === 'string') update.email = email;
  if (typeof bio === 'string') update.bio = bio;
  if (typeof profile_picture_url === 'string') update.profile_picture_url = profile_picture_url;

  if (Object.prototype.hasOwnProperty.call(req.body ?? {}, 'trade_preferences')) {
    update.trade_preferences = normalizeStringArray(trade_preferences);
  }
  if (Object.prototype.hasOwnProperty.call(req.body ?? {}, 'category_preferences')) {
    update.category_preferences = normalizeStringArray(category_preferences);
  }
  if (Object.prototype.hasOwnProperty.call(req.body ?? {}, 'interests')) {
    update.interests = normalizeStringArray(interests);
  }

  if (Object.keys(update).length === 0) {
    return res.status(400).json({ error: 'Nothing to update' });
  }

  const { data, error } = await supabase
    .from('users')
    .update(update)
    .eq('id', id)
    .select('id, email, user_name, created_at, bio, rating, profile_picture_url, trade_preferences, category_preferences, interests')
    .single();

  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: 'User not found' });
  return res.json({ user: data });
});

export default router;

