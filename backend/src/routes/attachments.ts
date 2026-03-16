import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

const uploadDir = process.env.UPLOAD_DIR || './uploads';
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|mp4|mov|avi|pdf|xlsx|csv/;
    const ext = path.extname(file.originalname).toLowerCase().slice(1);
    if (allowed.test(ext)) cb(null, true);
    else cb(new Error('File type not allowed'));
  },
});

router.use(authMiddleware);

// POST /attachments/:problemId
router.post('/:problemId', upload.array('files', 10), async (req: AuthRequest, res: Response) => {
  try {
    const problem = await prisma.problem.findFirst({
      where: { id: req.params.problemId, organizationId: req.user!.organizationId },
    });
    if (!problem) return res.status(404).json({ error: 'Problem not found' });

    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) return res.status(400).json({ error: 'No files uploaded' });

    const attachments = await Promise.all(
      files.map((file) =>
        prisma.attachment.create({
          data: {
            filename: file.originalname,
            url: `/uploads/${file.filename}`,
            mimeType: file.mimetype,
            size: file.size,
            problemId: req.params.problemId,
          },
        })
      )
    );

    res.json({ attachments });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// DELETE /attachments/:id
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const attachment = await prisma.attachment.findFirst({
      where: { id: req.params.id, problem: { organizationId: req.user!.organizationId } },
    });
    if (!attachment) return res.status(404).json({ error: 'Not found' });

    const filePath = path.join(uploadDir, path.basename(attachment.url));
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await prisma.attachment.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete attachment' });
  }
});

export default router;
