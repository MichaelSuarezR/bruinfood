import { Router, Request, Response } from 'express';
import { supabase } from '../lib/supabase';

const router = Router();

// POST /api/ratings - create or update a rating
router.post('/', async (req: Request, res: Response) => {
  const { rater_id, rated_user_id, rating } = req.body ?? {};

  if (!rater_id || typeof rater_id !== 'string') {
    return res.status(400).json({ error: 'rater_id (uuid string) is required' });
  }
  if (!rated_user_id || typeof rated_user_id !== 'string') {
    return res.status(400).json({ error: 'rated_user_id (uuid string) is required' });
  }
  if (typeof rating !== 'number' || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'rating must be a number between 1 and 5' });
  }

  // Check if rating exists
  const existing = await supabase
    .from('Ratings')
    .select('id')
    .eq('rater_id', rater_id)
    .eq('rated_user_id', rated_user_id)
    .maybeSingle();

  let result;
  if (existing.data) {
    // Update existing rating
    result = await supabase
      .from('Ratings')
      .update({ rating })
      .eq('id', existing.data.id)
      .select('id, rater_id, rated_user_id, rating, created_at')
      .single();
  } else {
    // Create new rating
    result = await supabase
      .from('Ratings')
      .insert([{ rater_id, rated_user_id, rating }])
      .select('id, rater_id, rated_user_id, rating, created_at')
      .single();
  }

  if (result.error) return res.status(500).json({ error: result.error.message });

  // Calculate and update user's average rating
  const { data: ratings } = await supabase
    .from('Ratings')
    .select('rating')
    .eq('rated_user_id', rated_user_id);

  if (ratings && ratings.length > 0) {
    const avgRating = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
    await supabase
      .from('users')
      .update({ rating: Math.round(avgRating * 10) / 10 }) // Round to 1 decimal
      .eq('id', rated_user_id);
  }

  return res.status(existing.data ? 200 : 201).json({ rating: result.data });
});

// GET /api/ratings/:user_id - get average rating for a user
router.get('/:user_id', async (req: Request, res: Response) => {
  const { user_id } = req.params;

  const { data: user } = await supabase
    .from('users')
    .select('rating')
    .eq('id', user_id)
    .single();

  if (!user) return res.status(404).json({ error: 'User not found' });

  return res.json({ 
    user_id,
    rating: user.rating ?? 0,
    rating_count: 0 // Could be calculated if needed
  });
});

export default router;
