import { Router, Request, Response } from 'express';
import { supabase } from '../lib/supabase';

const router = Router();

// POST /api/upload/images - upload images to Supabase storage
// Body: { images: string[], userId: string }
// images: array of base64 encoded image strings
router.post('/images', async (req: Request, res: Response) => {
  try {
    const { images, userId } = req.body ?? {};

    console.log('Upload request received:', {
      hasImages: !!images,
      imagesType: Array.isArray(images) ? 'array' : typeof images,
      imagesLength: Array.isArray(images) ? images.length : 'N/A',
      hasUserId: !!userId,
      userIdType: typeof userId
    });

    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ error: 'images (array of base64 strings) is required' });
    }
    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: 'userId (string) is required' });
    }

  const uploadedUrls: string[] = [];

  for (let i = 0; i < images.length; i++) {
    try {
      const imageData = images[i];
      
      if (!imageData) {
        console.error(`Image data is undefined at index ${i}`);
        continue;
      }

      // Handle both string and object formats
      let base64String: string;
      if (typeof imageData === 'string') {
        base64String = imageData;
      } else if (imageData && typeof imageData === 'object' && 'base64' in imageData) {
        base64String = (imageData as any).base64;
      } else {
        console.error(`Invalid image data format at index ${i}:`, typeof imageData);
        continue;
      }

      if (!base64String || typeof base64String !== 'string' || base64String.length === 0) {
        console.error(`Invalid or empty base64 string at index ${i}`);
        continue;
      }

      // Remove data URL prefix if present (e.g., "data:image/jpeg;base64,")
      const base64Data = base64String.includes(',') 
        ? base64String.split(',')[1] 
        : base64String;

      if (!base64Data || base64Data.length === 0) {
        console.error(`Empty base64 data after processing at index ${i}`);
        continue;
      }

      // Determine file extension (default to jpg)
      let fileExt = 'jpg';
      if (base64String.startsWith('data:image/')) {
        const mimeMatch = base64String.match(/data:image\/([^;]+)/);
        if (mimeMatch) {
          const mimeType = mimeMatch[1];
          if (mimeType === 'jpeg') fileExt = 'jpg';
          else if (['png', 'gif', 'webp'].includes(mimeType)) fileExt = mimeType;
          else fileExt = 'jpg';
        }
      }

      // Convert base64 to buffer
      let buffer: Buffer;
      try {
        buffer = Buffer.from(base64Data, 'base64');
        if (buffer.length === 0) {
          console.error(`Empty buffer created at index ${i}`);
          continue;
        }
      } catch (bufferError: any) {
        console.error(`Error creating buffer at index ${i}:`, bufferError);
        continue;
      }

      // Generate unique filename
      const fileName = `${userId}/${Date.now()}-${i}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = fileName;

      // Upload to Supabase storage
      const { data, error } = await supabase.storage
        .from('trade-images')
        .upload(filePath, buffer, {
          contentType: `image/${fileExt}`,
          upsert: false,
        });

      if (error) {
        console.error(`Error uploading image ${i}:`, error);
        continue;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('trade-images')
        .getPublicUrl(filePath);

      if (urlData?.publicUrl) {
        uploadedUrls.push(urlData.publicUrl);
      }
    } catch (error: any) {
      console.error(`Error processing image ${i}:`, error);
      console.error(`Error details:`, error?.message, error?.stack);
    }
  }

  if (uploadedUrls.length === 0) {
    return res.status(500).json({ error: 'Failed to upload any images' });
  }

  return res.status(200).json({ 
    urls: uploadedUrls,
    uploaded: uploadedUrls.length,
    total: images.length
  });
  } catch (error: any) {
    console.error('Error in upload endpoint:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

export default router;
