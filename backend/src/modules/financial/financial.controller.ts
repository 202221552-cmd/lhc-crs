import { Request, Response, NextFunction } from 'express';
import { installmentService } from './financial.service.js';
import { PayStudentBodySchema, InstallmentCreateSchema } from './financial.schema.js';
import { ValidationError } from '../../shared/errors.js';

export class FinancialController {
  // POST /api/v2/financial/pay-student
  async payStudent(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = PayStudentBodySchema.parse(req.body);
      const result = await installmentService.payStudent(parsed);
      res.json(result);
    } catch (err) {
      next(err instanceof SyntaxError ? new ValidationError('بيانات غير صالحة') : err);
    }
  }

  // POST /api/v2/financial/installments
  async createInstallment(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = InstallmentCreateSchema.parse(req.body);
      const result = await installmentService.create(parsed);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }

  // GET /api/v2/financial/students/:id/balance
  async getStudentBalance(req: Request, res: Response, next: NextFunction) {
    try {
      const balance = await installmentService.getStudentBalance(req.params.id as string);
      res.json(balance);
    } catch (err) {
      next(err);
    }
  }
}

export const financialController = new FinancialController();
