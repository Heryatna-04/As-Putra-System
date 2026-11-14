"use client";

import { useEffect, useRef, useState } from "react";
import {
  BookmarkPlus,
  Check,
  Copy,
  ExternalLink,
  MessageSquare,
  Phone,
  Plus,
  RotateCcw,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  BUILT_IN_WA_TEMPLATES,
  WA_TEMPLATE_VARIABLES,
  buildDirectWaUrl,
  formatPhoneForWa,
  loadCustomWaTemplates,
  resolveTemplateMessage,
  saveCustomWaTemplates,
  type WaFollowUpBooking,
  type WaTemplate,
} from "@/lib/whatsapp-followup";

export interface WhatsAppFollowUpModalProps {
  /** Selected booking to compose a WhatsApp message for, or null when closed. */
  booking: WaFollowUpBooking | null;
  /** Callback fired when closing the modal via button, backdrop, or Escape key. */
  onClose: () => void;
  /** Optional portal badge context shown in modal header (e.g. "Admin" or "CRM"). */
  sourceLabel?: string;
}

const DEFAULT_CUSTOM_DRAFT =
  "Halo Bapak/Ibu *{nama}*,\n\nTerkait booking *{tiket}* ({kendaraan}) pada {tanggal} pukul {jam} WIB:\n\n";

function WhatsAppComposerInner({
  booking,
  onClose,
  sourceLabel,
}: {
  booking: WaFollowUpBooking;
  onClose: () => void;
  sourceLabel?: string;
}) {
  const [customTemplates, setCustomTemplates] = useState<WaTemplate[]>(() =>
    loadCustomWaTemplates()
  );
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    BUILT_IN_WA_TEMPLATES[0].id
  );
  const [message, setMessage] = useState<string>(() =>
    resolveTemplateMessage(BUILT_IN_WA_TEMPLATES[0], booking)
  );
  const [isCreating, setIsCreating] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [newTemplateBody, setNewTemplateBody] = useState(DEFAULT_CUSTOM_DRAFT);
  const [copied, setCopied] = useState(false);
  const customBodyRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const rawPhone = booking.no_hp || booking.no_telepon || "";
  const formattedPhone = formatPhoneForWa(rawPhone);
  const waUrl = buildDirectWaUrl(rawPhone, message);
  const allTemplates: WaTemplate[] = [
    ...BUILT_IN_WA_TEMPLATES,
    ...customTemplates,
  ];
  const isManualMode = selectedTemplateId === "manual_blank";
  const canSendWa = Boolean(waUrl) && message.trim().length > 0;

  const handleSelectTemplate = (template: WaTemplate) => {
    setSelectedTemplateId(template.id);
    setMessage(resolveTemplateMessage(template, booking));
  };

  const handleResetMessage = () => {
    const active =
      allTemplates.find((tpl) => tpl.id === selectedTemplateId) ??
      BUILT_IN_WA_TEMPLATES[0];
    setMessage(resolveTemplateMessage(active, booking));
    toast.success("Isi pesan dikembalikan ke template aktif");
  };

  const handleCopyMessage = async () => {
    if (!message.trim()) {
      toast.error("Pesan WhatsApp masih kosong");
      return;
    }
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      toast.success("Pesan berhasil disalin");
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Gagal menyalin pesan ke clipboard");
    }
  };

  const handleInsertVariable = (token: string) => {
    const textarea = customBodyRef.current;
    if (!textarea) {
      setNewTemplateBody((prev) => `${prev}${token}`);
      return;
    }
    const start = textarea.selectionStart ?? newTemplateBody.length;
    const end = textarea.selectionEnd ?? newTemplateBody.length;
    const nextValue =
      newTemplateBody.slice(0, start) + token + newTemplateBody.slice(end);
    setNewTemplateBody(nextValue);

    window.requestAnimationFrame(() => {
      textarea.focus();
      const cursor = start + token.length;
      textarea.setSelectionRange(cursor, cursor);
    });
  };

  const handleSaveCustomTemplate = (event: React.FormEvent) => {
    event.preventDefault();
    const cleanName = newTemplateName.trim();
    const cleanBody = newTemplateBody.trim();

    if (!cleanName || !cleanBody) {
      toast.error("Nama dan isi template wajib diisi");
      return;
    }

    const created: WaTemplate = {
      id: `custom_${Date.now()}`,
      name: cleanName,
      category: "CUSTOM",
      body: cleanBody,
    };

    const nextTemplates = [...customTemplates, created];
    setCustomTemplates(nextTemplates);
    saveCustomWaTemplates(nextTemplates);
    setSelectedTemplateId(created.id);
    setMessage(resolveTemplateMessage(created, booking));
    setNewTemplateName("");
    setNewTemplateBody(DEFAULT_CUSTOM_DRAFT);
    setIsCreating(false);
    toast.success(`Template "${cleanName}" tersimpan`);
  };

  const handleDeleteCustomTemplate = (templateId: string) => {
    const nextTemplates = customTemplates.filter((tpl) => tpl.id !== templateId);
    setCustomTemplates(nextTemplates);
    saveCustomWaTemplates(nextTemplates);

    if (selectedTemplateId === templateId) {
      setSelectedTemplateId(BUILT_IN_WA_TEMPLATES[0].id);
      setMessage(resolveTemplateMessage(BUILT_IN_WA_TEMPLATES[0], booking));
    }
    toast.success("Template kustom dihapus");
  };

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/65 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="wa-followup-modal-title"
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-2xl text-slate-900 dark:text-slate-100 animate-in fade-in zoom-in-95 duration-200"
        onClick={(event) => event.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 sticky top-0 bg-white/95 dark:bg-[#111827]/95 backdrop-blur-xs z-10">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/80 dark:border-emerald-900/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3
                  id="wa-followup-modal-title"
                  className="text-sm font-bold text-slate-900 dark:text-white"
                >
                  Follow-Up WhatsApp Pelanggan
                </h3>
                {sourceLabel && (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-50 dark:bg-red-950/40 text-[#E4002B] border border-red-200/70 dark:border-red-900/50">
                    {sourceLabel}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                Pilih template bengkel, buat template sendiri, atau ketik pesan manual
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup modal WhatsApp"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Customer / Booking Context Summary */}
          <div className="rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 p-3.5 flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200">
                  {booking.ticket_no}
                </span>
                <span className="text-sm font-bold text-slate-900 dark:text-white truncate">
                  {booking.nama_customer}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {booking.tanggal_booking} • {booking.jam_booking} WIB •{" "}
                {booking.tipe_motor || "Honda"} ({booking.plat_kendaraan || "-"})
              </p>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-mono font-semibold px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
              <Phone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{formattedPhone ? `+${formattedPhone}` : "No. HP belum valid"}</span>
            </div>
          </div>

          {/* Template Picker */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Template Pesan
              </span>
              <button
                type="button"
                onClick={() => setIsCreating((prev) => !prev)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-[#E4002B]" />
                {isCreating ? "Tutup Form Template" : "Buat Template Sendiri"}
              </button>
            </div>

            {/* Built-in Presets */}
            <div className="flex flex-wrap gap-1.5">
              {BUILT_IN_WA_TEMPLATES.map((tpl) => {
                const isActive = selectedTemplateId === tpl.id;
                return (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => handleSelectTemplate(tpl)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                      isActive
                        ? "bg-[#E4002B] text-white border-[#E4002B] shadow-xs"
                        : "bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                    }`}
                  >
                    {tpl.name}
                  </button>
                );
              })}
            </div>

            {/* Saved Custom Templates */}
            {customTemplates.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Template Buatan Bengkel
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {customTemplates.map((tpl) => {
                    const isActive = selectedTemplateId === tpl.id;
                    return (
                      <div
                        key={tpl.id}
                        className={`inline-flex items-center rounded-xl border text-xs font-semibold overflow-hidden transition ${
                          isActive
                            ? "bg-emerald-600 text-white border-emerald-600"
                            : "bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/60"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => handleSelectTemplate(tpl)}
                          className="px-2.5 py-1.5 cursor-pointer hover:opacity-90"
                        >
                          {tpl.name}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCustomTemplate(tpl.id)}
                          aria-label={`Hapus template ${tpl.name}`}
                          title={`Hapus template ${tpl.name}`}
                          className={`px-2 py-1.5 border-l cursor-pointer transition ${
                            isActive
                              ? "border-white/25 hover:bg-emerald-700"
                              : "border-emerald-200 dark:border-emerald-900/60 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600 dark:hover:text-red-400"
                          }`}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Custom Template Builder Form */}
          {isCreating && (
            <form
              onSubmit={handleSaveCustomTemplate}
              className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-900/80 p-4 space-y-3"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                  <BookmarkPlus className="w-3.5 h-3.5 text-[#E4002B]" />
                  Simpan Template Kustom Baru
                </span>
                <span className="text-[11px] text-slate-400">
                  Tersimpan otomatis di perangkat ini
                </span>
              </div>

              <input
                type="text"
                value={newTemplateName}
                onChange={(event) => setNewTemplateName(event.target.value)}
                placeholder="Nama template (mis. Konfirmasi Oli / Indent Part)"
                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#E4002B]/25 focus:border-[#E4002B]"
              />

              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
                  Sisipkan data otomatis ke isi template:
                </span>
                <div className="flex flex-wrap gap-1">
                  {WA_TEMPLATE_VARIABLES.map((variable) => (
                    <button
                      key={variable.token}
                      type="button"
                      onClick={() => handleInsertVariable(variable.token)}
                      className="px-2 py-1 rounded-md text-[11px] font-mono bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-[#E4002B] hover:text-[#E4002B] transition cursor-pointer"
                      title={`Sisipkan ${variable.label}`}
                    >
                      {variable.token}
                    </button>
                  ))}
                </div>
              </div>

              <textarea
                ref={customBodyRef}
                rows={4}
                value={newTemplateBody}
                onChange={(event) => setNewTemplateBody(event.target.value)}
                placeholder="Tulis isi template pesan WhatsApp..."
                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#E4002B]/25 focus:border-[#E4002B]"
              />

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-[#E4002B] hover:bg-[#C80021] text-white transition cursor-pointer"
                >
                  Simpan Template
                </button>
              </div>
            </form>
          )}

          {/* Manual Editor / Live Preview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor="wa-message-editor"
                className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"
              >
                {isManualMode
                  ? "Pesan Manual (Siap Dikirim)"
                  : "Pratinjau & Edit Pesan"}
              </label>
              <button
                type="button"
                onClick={handleResetMessage}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                Reset Template
              </button>
            </div>

            <textarea
              id="wa-message-editor"
              rows={8}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Ketik pesan follow-up WhatsApp untuk pelanggan..."
              className="w-full px-3.5 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm leading-relaxed text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500"
            />
            <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
              <span>Anda dapat mengedit pesan secara manual sebelum mengirim.</span>
              <span className="tabular-nums">{message.length} karakter</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/70 flex flex-wrap items-center justify-between gap-2.5">
          <button
            type="button"
            onClick={handleCopyMessage}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 transition cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                Tersalin
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                Salin Pesan
              </>
            )}
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              Tutup
            </button>

            {canSendWa ? (
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Kirim via WhatsApp
              </a>
            ) : (
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-bold cursor-not-allowed">
                Nomor HP atau pesan kosong
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Reusable modal composer allowing Admin and CRM staff to send WhatsApp
 * follow-ups using preset workshop templates, saved custom templates,
 * or freehand manual messages.
 */
export default function WhatsAppFollowUpModal({
  booking,
  onClose,
  sourceLabel,
}: WhatsAppFollowUpModalProps) {
  if (!booking) return null;

  return (
    <WhatsAppComposerInner
      key={`${booking.id}-${booking.status}`}
      booking={booking}
      onClose={onClose}
      sourceLabel={sourceLabel}
    />
  );
}
