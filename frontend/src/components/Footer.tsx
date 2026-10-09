import { MapPin, Clock, Phone } from "lucide-react";

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-zinc-200 bg-white font-sans">
      {/* Top Footer: Info Details & Map */}
      <div className="border-b border-zinc-200/80 bg-zinc-50 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
          {/* Info Details */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#E4002B]" />
              <h3 className="font-display text-xl font-bold text-zinc-900 tracking-tight">
                AS Putra Rahmat
              </h3>
            </div>
            <p className="text-sm font-semibold text-[#B00020] mb-6">
              Dealer & AHASS Bengkel Resmi Honda — Kuningan
            </p>

            <div className="space-y-4 text-sm text-zinc-600">
              {/* Alamat */}
              <div className="flex items-start gap-3.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-white text-[#B00020] shadow-xs">
                  <MapPin className="h-4 w-4" />
                </div>
                <div>
                  <div className="font-semibold text-zinc-900">Alamat Bengkel & Dealer</div>
                  <p className="mt-0.5 leading-relaxed text-zinc-600">
                    Jl. Siliwangi 126 Kasturi, Sebelah Utara Taman Cirendang,<br />
                    Kabupaten Kuningan, Jawa Barat 45518
                  </p>
                </div>
              </div>

              {/* Jam Operasional */}
              <div className="flex items-start gap-3.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-white text-[#B00020] shadow-xs">
                  <Clock className="h-4 w-4" />
                </div>
                <div>
                  <div className="font-semibold text-zinc-900">Jam Operasional</div>
                  <div className="mt-1 space-y-1 text-zinc-600">
                    <div className="flex gap-4">
                      <span className="w-28 font-medium text-zinc-500">Senin – Sabtu</span>
                      <span className="font-semibold text-zinc-800">08:00 – 16:00 WIB</span>
                    </div>
                    <div className="flex gap-4">
                      <span className="w-28 font-medium text-zinc-500">Minggu</span>
                      <span className="font-semibold text-zinc-800">08:00 – 15:00 WIB</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Telepon / WA */}
              <div className="flex items-start gap-3.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-white text-[#B00020] shadow-xs">
                  <Phone className="h-4 w-4" />
                </div>
                <div>
                  <div className="font-semibold text-zinc-900">Layanan Pelanggan & WhatsApp</div>
                  <a
                    href="https://wa.me/6281111116408"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-0.5 inline-block text-base font-bold text-emerald-700 hover:underline"
                  >
                    +62 811-1111-6408
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Map Embed */}
          <div>
            <h4 className="mb-3 text-sm font-semibold text-zinc-900">
              Lokasi Bengkel di Google Maps
            </h4>
            <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xs">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d319.7268610197772!2d108.48832525312899!3d-6.9516689375066765!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e6f16edc0e25e75%3A0x5a4162116590d82d!2sDealer%20Honda%20AS%20Putra%20Motor%20Kuningan!5e1!3m2!1sen!2sid!4v1790916002596!5m2!1sen!2sid"
                className="h-[230px] w-full border-0"
                allowFullScreen
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
                title="Peta Dealer Honda AS Putra Motor Kuningan"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Footer: Copyright */}
      <div className="bg-white px-4 py-5 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 text-xs text-zinc-500 sm:flex-row">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#E4002B]" />
            <span className="font-semibold text-zinc-800">AS Putra Rahmat</span>
            <span>— Dealer & Bengkel Resmi Honda</span>
          </div>
          <div className="flex items-center gap-2.5 text-zinc-400 flex-wrap justify-center">
            <span>© 2026 AHASS 10870</span>
            <span>•</span>
            <span>Dikembangkan oleh <strong className="font-semibold text-zinc-700">Kelompok 37 KP FKOM UNIKU</strong></span>
          </div>
        </div>
      </div>
    </footer>
  );
}
