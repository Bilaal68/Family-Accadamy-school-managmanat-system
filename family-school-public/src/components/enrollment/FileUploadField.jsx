import { CheckCircle, FileText, Upload } from "lucide-react";

export default function FileUploadField({ label, hint, file, onChange, highlight, required }) {
  return (
    <div
      className={
        highlight
          ? "rounded-xl border border-[#C2B30C]/50 bg-[#C2B30C]/5 p-4"
          : "rounded-xl border border-dashed border-[#E8E6FF] bg-[#fafaff] p-4"
      }
    >
      <div className="flex items-start gap-3">
        <div
          className={
            highlight
              ? "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#C2B30C]/20"
              : "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#f4f3ff]"
          }
        >
          <FileText className="h-5 w-5 text-[#10026B]" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-[#10026B]">
            {label}
            {required && <span className="ml-1 text-red-500">*</span>}
          </p>
          {hint && <p className="mt-0.5 text-xs text-[#6b63a3]">{hint}</p>}
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <label
              className={
                highlight
                  ? "inline-flex cursor-pointer items-center gap-2 rounded-lg bg-[#C2B30C] px-4 py-2 text-sm font-semibold text-[#10026B] transition hover:bg-[#d4c50e]"
                  : "inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[#E8E6FF] bg-white px-4 py-2 text-sm font-medium text-[#10026B] transition hover:border-[#10026B]/30 hover:bg-[#f4f3ff]"
              }
            >
              <Upload className="h-4 w-4" />
              {file ? "Change file" : "Choose file"}
              <input
                type="file"
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => onChange(e.target.files?.[0] || null)}
              />
            </label>
            {file && (
              <span className="flex items-center gap-1.5 truncate text-sm text-green-700">
                <CheckCircle className="h-4 w-4 shrink-0" />
                <span className="truncate">{file.name}</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
