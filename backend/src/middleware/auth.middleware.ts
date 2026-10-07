import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';

export interface AuthUser {
  id: string;
  email: string;
  role: 'ADMIN' | 'KEPALA_BENGKEL' | 'CRM';
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export const authMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: 'Token autentikasi tidak ditemukan', errors: [] });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    // Verifikasi JWT via Supabase Auth
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      res.status(401).json({ success: false, message: 'Token tidak valid atau sudah kedaluwarsa', errors: [] });
      return;
    }

    // Ambil role dari tabel profiles
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      res.status(403).json({ success: false, message: 'Profil pengguna tidak ditemukan', errors: [] });
      return;
    }

    req.user = {
      id: user.id,
      email: user.email ?? '',
      role: profile.role,
    };

    next();
  } catch (err) {
    next(err);
  }
};
