import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { uploadFile, deleteFile } from '../services/storage.js';

const router = Router();

const storage = multer({ storage: multer.memoryStorage() });

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];

router.post('/upload', storage.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: { message: 'No file provided.' },
      });
    }

    if (!ALLOWED_TYPES.includes(req.file.mimetype)) {
      return res.status(400).json({
        error: { message: 'Invalid file type. Allowed: jpg, png, gif, webp, svg.' },
      });
    }

    const bucket = req.body.bucket || 'blog-images';
    const userId = req.body.userId;

    const result = await uploadFile(req.file.buffer, req.file.originalname, bucket, userId);

    res.json({
      url: result.url,
      path: result.path,
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      error: { message: 'Failed to upload file.' },
    });
  }
});

router.delete('/delete', async (req: Request, res: Response) => {
  try {
    const { path: filePath } = req.body;
    const bucket = req.body.bucket || 'blog-images';

    if (!filePath) {
      return res.status(400).json({
        error: { message: 'File path is required.' },
      });
    }

    await deleteFile(filePath, bucket);

    res.json({ success: true });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({
      error: { message: 'Failed to delete file.' },
    });
  }
});

export default router;