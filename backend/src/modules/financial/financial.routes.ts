import { Router } from 'express';
import { financialController } from './financial.controller.js';

export const financialV2Routes = Router();

// v2 routes: cleaner, validated, error-handled
financialV2Routes.post('/pay-student', financialController.payStudent.bind(financialController));
financialV2Routes.post('/installments', financialController.createInstallment.bind(financialController));
financialV2Routes.get('/students/:id/balance', financialController.getStudentBalance.bind(financialController));
