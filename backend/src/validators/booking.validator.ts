import { Request, Response, NextFunction } from 'express';

export const validateCreateBooking = (req: Request, res: Response, next: NextFunction): void => {
  const {
    tipe_booking = 'SERVIS',
    nama_customer,
    email,
    no_hp,
    no_mesin,
    plat_kendaraan,
    tanggal_booking,
    jam_booking,
    jenis_servis,
    detail_lainnya,
    items,
  } = req.body;
  const errors: string[] = [];

  const isSparepart = tipe_booking === 'SPAREPART';

  if (!nama_customer || typeof nama_customer !== 'string' || nama_customer.trim().length < 2) {
    errors.push('Nama customer wajib diisi minimal 2 karakter');
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || typeof email !== 'string' || !emailRegex.test(email.trim())) {
    errors.push('Email / Gmail valid wajib diisi sebagai bukti akun pemesan');
  }

  const phoneRegex = /^(0|62|\+62)[0-9]{8,13}$/;
  if (!no_hp || !phoneRegex.test(String(no_hp).replace(/\s|-/g, ''))) {
    errors.push('Nomor WhatsApp/HP tidak valid (contoh: 081234567890)');
  }

  if (!tanggal_booking || isNaN(Date.parse(tanggal_booking))) {
    errors.push('Tanggal booking wajib valid');
  }

  if (!jam_booking || typeof jam_booking !== 'string' || jam_booking.trim().length === 0) {
    errors.push('Jam booking wajib dipilih');
  }

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

    let selectedServices: string[] = [];
    if (Array.isArray(jenis_servis)) {
      selectedServices = jenis_servis;
    } else if (typeof jenis_servis === 'string' && jenis_servis.trim().length > 0) {
      selectedServices = jenis_servis.split(',').map((s) => s.trim());
    }

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
