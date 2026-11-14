import { Request, Response, NextFunction } from 'express';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^(0|62|\+62)[0-9]{8,13}$/;
const ADMIN_CREATE_STATUSES = ['PENDING', 'CONFIRMED', 'IN_PROGRESS'] as const;

function parseSelectedServices(jenisServis: unknown): string[] {
  if (Array.isArray(jenisServis)) {
    return jenisServis.map((s) => String(s).trim()).filter(Boolean);
  }
  if (typeof jenisServis === 'string' && jenisServis.trim().length > 0) {
    return jenisServis.split(',').map((s) => s.trim()).filter(Boolean);
  }
  return [];
}

function validateCommonCustomerFields(
  body: Record<string, unknown>,
  requireEmail: boolean
): string[] {
  const { nama_customer, email, no_hp, tanggal_booking, jam_booking } = body;
  const errors: string[] = [];

  if (!nama_customer || typeof nama_customer !== 'string' || nama_customer.trim().length < 2) {
    errors.push('Nama customer wajib diisi minimal 2 karakter');
  }

  const trimmedEmail = typeof email === 'string' ? email.trim() : '';
  if (requireEmail) {
    if (!trimmedEmail || !EMAIL_REGEX.test(trimmedEmail)) {
      errors.push('Email / Gmail valid wajib diisi sebagai bukti akun pemesan');
    }
  } else if (trimmedEmail.length > 0 && !EMAIL_REGEX.test(trimmedEmail)) {
    errors.push('Format Email tidak valid');
  }

  if (!no_hp || !PHONE_REGEX.test(String(no_hp).replace(/\s|-/g, ''))) {
    errors.push('Nomor WhatsApp/HP tidak valid (contoh: 081234567890)');
  }

  if (!tanggal_booking || typeof tanggal_booking !== 'string' || isNaN(Date.parse(tanggal_booking))) {
    errors.push('Tanggal booking wajib valid');
  }

  if (!jam_booking || typeof jam_booking !== 'string' || jam_booking.trim().length === 0) {
    errors.push('Jam booking wajib dipilih');
  }

  return errors;
}

export const validateCreateBooking = (req: Request, res: Response, next: NextFunction): void => {
  const {
    tipe_booking = 'SERVIS',
    no_mesin,
    plat_kendaraan,
    jenis_servis,
    detail_lainnya,
    items,
  } = req.body;
  const errors = validateCommonCustomerFields(req.body, true);

  const isSparepart = tipe_booking === 'SPAREPART';

  if (isSparepart) {
    // Validasi khusus booking suku cadang
    if (!Array.isArray(items) || items.length === 0) {
      errors.push('Pilih minimal satu suku cadang untuk dibooking');
    } else {
      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        if (!it || typeof it !== 'object') {
          errors.push(`Data suku cadang #${i + 1} tidak valid`);
          break;
        }
        if (!it.part_no || typeof it.part_no !== 'string') {
          errors.push(`Nomor part pada item #${i + 1} wajib diisi`);
        }
        if (!it.part_name || typeof it.part_name !== 'string') {
          errors.push(`Nama part pada item #${i + 1} wajib diisi`);
        }
        if (!it.quantity || typeof it.quantity !== 'number' || it.quantity < 1) {
          errors.push(`Jumlah suku cadang #${i + 1} minimal 1 pcs`);
        }
      }
    }
  } else {
    // Validasi khusus booking servis motor
    if (!no_mesin || typeof no_mesin !== 'string' || no_mesin.trim().length < 4) {
      errors.push('Nomor mesin wajib diisi minimal 4 karakter');
    }

    if (!plat_kendaraan || typeof plat_kendaraan !== 'string' || plat_kendaraan.trim().length < 3) {
      errors.push('Plat nomor kendaraan wajib diisi (contoh: B 1234 ABC)');
    }

    const validServices = [
      'Ganti Oli Mesin Saja',
      'Servis & Bongkar CVT',
      'Paket Ganti Oli + 5 Poin Servis',
      'Paket Servis Ringan',
      'Paket Servis Lengkap',
      'Ganti Oli',
      'Bongkar CVT',
      'Servis Paket Lengkap Perawatan',
      'KPB 1 (1.000 km / 2 Bulan)',
      'KPB 2 (4.000 km / 4 Bulan)',
      'KPB 3 (8.000 km / 8 Bulan)',
      'KPB 4 (12.000 km / 12 Bulan)',
      'KPB 1 (160cc+) (1.000 km / 2 Bulan)',
      'KPB 2 (160cc+) (6.000 km / 6 Bulan)',
      'KPB 3 (160cc+) (12.000 km / 12 Bulan)',
      'Lainnya',
    ];

    let selectedServices = parseSelectedServices(jenis_servis);

    if (selectedServices.length === 0) {
      errors.push(`Pilih minimal satu jenis servis`);
    } else {
      const invalidItems = selectedServices.filter((s) => !validServices.includes(s));
      if (invalidItems.length > 0) {
        errors.push(`Jenis servis tidak valid: ${invalidItems.join(', ')}`);
      }
    }

    if (selectedServices.includes('Lainnya') && (!detail_lainnya || typeof detail_lainnya !== 'string' || detail_lainnya.trim().length < 3)) {
      errors.push('Untuk opsi "Lainnya", sebutkan kebutuhan servis Anda secara rinci');
    }
  }

  if (errors.length > 0) {
    res.status(400).json({
      success: false,
      message: 'Validasi form booking gagal',
      errors,
    });
    return;
  }

  next();
};

export const validateCreateAdminBooking = (req: Request, res: Response, next: NextFunction): void => {
  const {
    no_mesin,
    plat_kendaraan,
    jenis_servis,
    detail_lainnya,
    status,
  } = req.body;
  const errors = validateCommonCustomerFields(req.body, false);

  if (typeof no_mesin === 'string' && no_mesin.trim().length > 0 && no_mesin.trim().length < 4) {
    errors.push('Nomor mesin minimal 4 karakter jika diisi');
  }

  if (typeof plat_kendaraan === 'string' && plat_kendaraan.trim().length > 0 && plat_kendaraan.trim().length < 3) {
    errors.push('Plat nomor minimal 3 karakter jika diisi');
  }

  const selectedServices = parseSelectedServices(jenis_servis);
  if (selectedServices.length === 0) {
    errors.push('Pilih atau isi minimal satu jenis servis');
  } else if (
    selectedServices.includes('Lainnya') &&
    (!detail_lainnya || typeof detail_lainnya !== 'string' || detail_lainnya.trim().length < 3)
  ) {
    errors.push('Untuk opsi "Lainnya", isi rincian servis minimal 3 karakter');
  }

  if (status !== undefined && (typeof status !== 'string' || !(ADMIN_CREATE_STATUSES as readonly string[]).includes(status))) {
    errors.push(`Status awal tidak valid. Harus salah satu dari: ${ADMIN_CREATE_STATUSES.join(', ')}`);
  }

  if (errors.length > 0) {
    res.status(400).json({
      success: false,
      message: 'Validasi input booking admin gagal',
      errors,
    });
    return;
  }

  next();
};

export const validateUpdateBookingStatus = (req: Request, res: Response, next: NextFunction): void => {
  const { status } = req.body;
  const validStatuses = ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'DONE', 'CANCELLED'];

  if (!status || !validStatuses.includes(status)) {
    res.status(400).json({
      success: false,
      message: `Status tidak valid. Harus salah satu dari: ${validStatuses.join(', ')}`,
      errors: ['Status booking tidak valid'],
    });
    return;
  }

  next();
};
