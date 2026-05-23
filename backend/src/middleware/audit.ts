import { Request, Response, NextFunction } from 'express';
import { prisma } from '../index';

export const auditLog = (action: string, entity: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Save original send
    const originalSend = res.json;

    res.json = function (body) {
      // Once the response is sent, we can log the action async
      const userId = (req as any).user?.id; // Assuming auth middleware attaches user
      
      if (userId) {
        // Extract useful details
        let details: any = {};
        if (action === 'SEARCH') {
          details.query = req.query;
        } else if (['CREATE', 'UPDATE'].includes(action)) {
          details.body = req.body;
        } else if (action === 'DELETE') {
          details.params = req.params;
        }

        const ipAddress = req.ip || req.headers['x-forwarded-for']?.toString();
        const deviceType = req.headers['user-agent'];

        // Fire and forget
        prisma.auditLog.create({
          data: {
            userId,
            action,
            entity,
            details: JSON.stringify(details),
            ipAddress,
            deviceType
          }
        }).catch(err => console.error("Audit Log Error:", err));
      }

      // Call original json method
      return originalSend.call(this, body);
    };

    next();
  };
};
