import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { prisma } from '../index';
import { authMiddleware, requirePermission } from '../middleware/auth';
import { compressImageBuffer } from '../utils/imageCompress';

const router = express.Router();

const UPLOADS_DIR = path.resolve(__dirname, '..', '..', 'uploads');
const EMPLOYEES_DIR = path.join(UPLOADS_DIR, 'employees');

if (!fs.existsSync(EMPLOYEES_DIR)) {
  fs.mkdirSync(EMPLOYEES_DIR, { recursive: true });
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('نوع الملف غير مدعوم — يرجى اختيار صورة JPEG أو PNG أو WebP'));
    }
  },
});

// Generic upload — no employee ID needed, returns the compressed file path
// Used before saving an employee (registration form)
router.post(
  '/upload-image',
  authMiddleware,
  upload.single('file'),
  async (req, res) => {
    try {
      const file = req.file as Express.Multer.File | undefined;
      if (!file) return res.status(400).json({ error: 'لم يتم اختيار ملف' });

      const result = await compressImageBuffer(file.buffer, EMPLOYEES_DIR, file.originalname);
      const url = `/uploads/employees/${result.filename}`;

      return res.json({
        url,
        originalSize: result.originalSize,
        compressedSize: result.compressedSize,
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'فشل رفع الصورة' });
    }
  }
);

// GET /api/employees/my-images — returns current user's employee images
router.get(
  '/my-images',
  authMiddleware,
  async (req, res) => {
    try {
      const user = (req as any).user;
      if (!user?.employeeId) return res.json({ idImages: '[]', contractImages: '[]' });

      const employee = await prisma.employee.findUnique({
        where: { id: user.employeeId },
        select: { idImages: true, contractImages: true },
      });

      if (!employee) return res.json({ idImages: '[]', contractImages: '[]' });
      return res.json(employee);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }
);

// POST /api/employees/my-images — employee uploads their own images from profile
router.post(
  '/my-images',
  authMiddleware,
  upload.array('files', 10),
  async (req, res) => {
    try {
      const user = (req as any).user;
      if (!user?.employeeId) return res.status(400).json({ error: 'لا يوجد موظف مرتبط بهذا الحساب' });

      const imageType = req.body.type as string;
      if (!['idFront', 'idBack', 'contract'].includes(imageType)) {
        return res.status(400).json({ error: 'نوع الصورة غير صالح' });
      }

      const employee = await prisma.employee.findUnique({ where: { id: user.employeeId } });
      if (!employee) return res.status(404).json({ error: 'الموظف غير موجود' });

      const files = req.files as Express.Multer.File[];
      if (!files?.length) return res.status(400).json({ error: 'لم يتم اختيار ملف' });

      const existingImages: string[] = JSON.parse(
        imageType === 'contract' ? (employee as any).contractImages || '[]' : (employee as any).idImages || '[]'
      );

      const newPaths: string[] = [];
      for (const file of files) {
        const result = await compressImageBuffer(file.buffer, EMPLOYEES_DIR, file.originalname);
        newPaths.push(`/uploads/employees/${result.filename}`);
      }

      let updatedImages: string[];
      if (imageType === 'contract') {
        updatedImages = [...existingImages, ...newPaths];
        await prisma.employee.update({
          where: { id: user.employeeId },
          data: { contractImages: JSON.stringify(updatedImages) },
        });
      } else {
        if (imageType === 'idFront') {
          updatedImages = [newPaths[0], existingImages[1] || ''].filter(Boolean);
        } else {
          updatedImages = [existingImages[0] || '', newPaths[0]].filter(Boolean);
        }
        await prisma.employee.update({
          where: { id: user.employeeId },
          data: { idImages: JSON.stringify(updatedImages) },
        });
      }

      return res.json({ images: updatedImages });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'فشل رفع الصور' });
    }
  }
);

// DELETE /api/employees/my-images/:type/:index — employee deletes their own image
router.delete(
  '/my-images/:type/:index',
  authMiddleware,
  async (req, res) => {
    try {
      const user = (req as any).user;
      if (!user?.employeeId) return res.status(400).json({ error: 'لا يوجد موظف مرتبط' });

      const imageType = req.params.type as string;
      const index = parseInt(req.params.index as string);

      if (!['idFront', 'idBack', 'contract'].includes(imageType)) {
        return res.status(400).json({ error: 'نوع الصورة غير صالح' });
      }

      const employee = await prisma.employee.findUnique({ where: { id: user.employeeId } });
      if (!employee) return res.status(404).json({ error: 'الموظف غير موجود' });

      const images: string[] = JSON.parse(
        imageType === 'contract' ? (employee as any).contractImages || '[]' : (employee as any).idImages || '[]'
      );

      if (index < 0 || index >= images.length) {
        return res.status(400).json({ error: 'الفهرس غير صالح' });
      }

      const filePath = path.join(UPLOADS_DIR, images[index].replace('/uploads/', ''));
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      images.splice(index, 1);

      const field = imageType === 'contract' ? 'contractImages' : 'idImages';
      await prisma.employee.update({
        where: { id: user.employeeId },
        data: { [field]: JSON.stringify(images) },
      });

      return res.json({ images });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'فشل حذف الصورة' });
    }
  }
);

// POST /api/employees/:id/images — Admin uploads images for an employee
router.post(
  '/:id/images',
  authMiddleware,
  requirePermission('admin.users'),
  upload.array('files', 10),
  async (req, res) => {
    try {
      const empId = parseInt(req.params.id as string);
      const imageType = req.body.type as string;

      if (!['idFront', 'idBack', 'contract'].includes(imageType)) {
        return res.status(400).json({ error: 'نوع الصورة غير صالح' });
      }

      const employee = await prisma.employee.findUnique({ where: { id: empId } });
      if (!employee) return res.status(404).json({ error: 'الموظف غير موجود' });

      const files = req.files as Express.Multer.File[];
      if (!files?.length) return res.status(400).json({ error: 'لم يتم اختيار ملف' });

      const existingImages: string[] = JSON.parse(
        imageType === 'contract' ? (employee as any).contractImages || '[]' : (employee as any).idImages || '[]'
      );

      const newPaths: string[] = [];
      for (const file of files) {
        const result = await compressImageBuffer(file.buffer, EMPLOYEES_DIR, file.originalname);
        newPaths.push(`/uploads/employees/${result.filename}`);
      }

      let updatedImages: string[];
      if (imageType === 'contract') {
        updatedImages = [...existingImages, ...newPaths];
        await prisma.employee.update({
          where: { id: empId },
          data: { contractImages: JSON.stringify(updatedImages) },
        });
      } else {
        if (imageType === 'idFront') {
          updatedImages = [newPaths[0], existingImages[1] || ''].filter(Boolean);
        } else {
          updatedImages = [existingImages[0] || '', newPaths[0]].filter(Boolean);
        }
        await prisma.employee.update({
          where: { id: empId },
          data: { idImages: JSON.stringify(updatedImages) },
        });
      }

      return res.json({ images: updatedImages });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'فشل رفع الصور' });
    }
  }
);

// DELETE /api/employees/:id/images/:type/:index — Admin deletes employee image
router.delete(
  '/:id/images/:type/:index',
  authMiddleware,
  requirePermission('admin.users'),
  async (req, res) => {
    try {
      const empId = parseInt(req.params.id as string);
      const imageType = req.params.type as string;
      const index = parseInt(req.params.index as string);

      if (!['idFront', 'idBack', 'contract'].includes(imageType)) {
        return res.status(400).json({ error: 'نوع الصورة غير صالح' });
      }

      const employee = await prisma.employee.findUnique({ where: { id: empId } });
      if (!employee) return res.status(404).json({ error: 'الموظف غير موجود' });

      const images: string[] = JSON.parse(
        imageType === 'contract' ? (employee as any).contractImages || '[]' : (employee as any).idImages || '[]'
      );

      if (index < 0 || index >= images.length) return res.status(400).json({ error: 'الفهرس غير صالح' });

      const filePath = path.join(UPLOADS_DIR, images[index].replace('/uploads/', ''));
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      images.splice(index, 1);

      const field = imageType === 'contract' ? 'contractImages' : 'idImages';
      await prisma.employee.update({
        where: { id: empId },
        data: { [field]: JSON.stringify(images) },
      });

      return res.json({ images });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'فشل حذف الصورة' });
    }
  }
);

export default router;
