import { Request, Response, NextFunction, RequestHandler } from 'express';
import { authMiddleware, AuthUser } from './auth.middleware';

type AllowedRole = 'ADMIN' | 'KEPALA_BENGKEL' | 'CRM';

/**
 * rbac() menggabungkan authMiddleware + role check dalam satu middleware chain.
 * Gunakan ini di route admin sebagai pengganti authMiddleware + rbac terpisah.
 */
export const rbac = (allowedRoles: AllowedRole[]): RequestHandler[] => {
  const roleCheck = (req: Request, res: Response, next: NextFunction): void => {
    const user = req.user as AuthUser | undefined;

    if (!user) {
      res.status(401).json({ success: false, message: 'Tidak terautentikasi', errors: [] });
      return;
    }

    if (!allowedRoles.includes(user.role)) {
      res.status(403).json({
        success: false,
        message: `Akses ditolak. Hanya ${allowedRoles.join(' atau ')} yang diizinkan.`,
        errors: [],
      });
      return;
    }

    next();
  };

  return [authMiddleware, roleCheck];
};
