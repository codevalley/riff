// ============================================
// API: /api/upload-image
// Handle user image uploads
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import crypto from 'crypto';
import sharp from 'sharp';

/**
 * Convert image buffer to WebP format for better compression
 * Skips GIFs to preserve animation
 */
async function convertToWebP(imageBuffer: Buffer, mimeType: string): Promise<{ buffer: Buffer; contentType: string; ext: string }> {
  // Don't convert GIFs (they might be animated)
  if (mimeType === 'image/gif') {
    return { buffer: imageBuffer, contentType: 'image/gif', ext: 'gif' };
  }

  try {
    const webpBuffer = await sharp(imageBuffer)
      .webp({ quality: 85 })
      .toBuffer();
    return { buffer: webpBuffer, contentType: 'image/webp', ext: 'webp' };
  } catch (error) {
    console.error('WebP conversion failed, using original:', error);
    const ext = mimeType.split('/')[1] || 'png';
    return { buffer: imageBuffer, contentType: mimeType, ext };
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const description = formData.get('description') as string | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: PNG, JPEG, WebP, GIF' },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size: 10MB' },
        { status: 400 }
      );
    }

    // Convert to WebP for better compression (except GIFs)
    const arrayBuffer = await file.arrayBuffer();
    const imageBuffer = Buffer.from(arrayBuffer);
    const { buffer: optimizedBuffer, contentType, ext } = await convertToWebP(imageBuffer, file.type);

    // Generate unique filename
    const hash = crypto.randomBytes(8).toString('hex');
    const filename = `uploads/${hash}.${ext}`;

    // Upload to blob storage with cache headers
    const blob = await put(filename, optimizedBuffer, {
      access: 'public',
      contentType,
      cacheControlMaxAge: 31536000, // 1 year - uploads are content-addressed
    });

    return NextResponse.json({
      url: blob.url,
      filename: blob.pathname,
      description: description || 'User uploaded image',
      source: 'uploaded',
    });

  } catch (error) {
    console.error('Error uploading image:', error);
    return NextResponse.json(
      { error: 'Failed to upload image', details: String(error) },
      { status: 500 }
    );
  }
}
