import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { LoginSchema } from '../validators/auth.validator';

export const AuthController = {
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = LoginSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          success: false,
          message: 'Email dan password wajib diisi',
          errors: parsed.error.issues,
        });
        return;
      }

      const result = await AuthService.login(parsed.data.email, parsed.data.password);
      res.json({
        success: true,
        message: 'Login berhasil',
        data: result,
      });
    } catch (err: any) {
      if (err?.message?.includes('Invalid login credentials')) {
        res.status(401).json({
          success: false,
          message: 'Email atau password salah',
          errors: [],
        });
        return;
      }
      next(err);
    }
  },

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader?.split(' ')[1];

      if (token) {
        await AuthService.logout(token);
      }

      res.json({ success: true, message: 'Logout berhasil' });
    } catch (err) {
      next(err);
    }
  },

  async me(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const profile = await AuthService.getProfile(user.id);

      res.json({
        success: true,
        message: 'Berhasil',
        data: profile,
      });
    } catch (err) {
      next(err);
    }
  },
};
