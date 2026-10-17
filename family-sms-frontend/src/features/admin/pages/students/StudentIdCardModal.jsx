import { useEffect, useState } from "react";
import { Download, Printer, RotateCw, Eye, X, Check, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { downloadStudentIdCard, fetchStudentIdCardPreview } from "@/api/students";

export default function StudentIdCardModal({ student, open, onOpenChange }) {
  const [side, setSide] = useState("front");
  const [academicYear, setAcademicYear] = useState(
    `${new Date().getFullYear()} / ${new Date().getFullYear() + 1}`
  );
  const [downloading, setDownloading] = useState(false);
  const [previewBlobUrl, setPreviewBlobUrl] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  useEffect(() => {
    let active = true;
    let currentUrl = null;
    if (!student || !open) {
      setPreviewBlobUrl(null);
      return;
    }

    const loadPreview = async () => {
      try {
        setLoadingPreview(true);
        const res = await fetchStudentIdCardPreview(student.id, side, academicYear);
        if (active && res?.data) {
          const blob = res.data instanceof Blob ? res.data : new Blob([res.data], { type: "image/jpeg" });
          currentUrl = URL.createObjectURL(blob);
          setPreviewBlobUrl((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return currentUrl;
          });
        }
      } catch (err) {
        console.error("Failed to load preview in modal", err);
      } finally {
        if (active) setLoadingPreview(false);
      }
    };
    loadPreview();
    return () => {
      active = false;
    };
  }, [student?.id, side, academicYear, open]);

  const handleDownload = async () => {
    try {
      setDownloading(true);
      const res = await downloadStudentIdCard(student.id, academicYear);
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `ID_Card_${student.student_id || student.full_name}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to download ID card", err);
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = async () => {
    try {
      setDownloading(true);
      const res = await downloadStudentIdCard(student.id, academicYear);
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const printWindow = window.open(url);
      if (printWindow) {
        printWindow.focus();
      }
    } catch (err) {
      console.error("Failed to print ID card", err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-white p-6 shadow-2xl rounded-2xl">
        <DialogHeader className="border-b pb-3">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-bold text-[#10026B]">
                Student ID Card Generator
              </DialogTitle>
              <p className="text-xs text-neutral-500 mt-1">
                Official Mati Academy / Family Academy student ID badge preview & print
              </p>
            </div>
            <span className="font-mono text-xs px-2.5 py-1 bg-amber-50 text-amber-700 font-semibold rounded-md border border-amber-200">
              {student?.student_id || "N/A"}
            </span>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Controls bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-neutral-50 p-3 rounded-lg border border-neutral-200">
            {/* Side toggle */}
            <div className="flex items-center gap-1.5 bg-white p-1 rounded-md border border-neutral-200">
              <button
                type="button"
                onClick={() => setSide("front")}
                className={`px-3 py-1.5 text-xs font-semibold rounded transition-all ${
                  side === "front"
                    ? "bg-[#10026B] text-white shadow-sm"
                    : "text-neutral-600 hover:text-black"
                }`}
              >
                Front Side
              </button>
              <button
                type="button"
                onClick={() => setSide("back")}
                className={`px-3 py-1.5 text-xs font-semibold rounded transition-all ${
                  side === "back"
                    ? "bg-[#10026B] text-white shadow-sm"
                    : "text-neutral-600 hover:text-black"
                }`}
              >
                Back Side
              </button>
            </div>

            {/* Academic Year select */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-neutral-600">Year:</label>
              <input
                type="text"
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                className="w-28 text-xs font-semibold px-2 py-1.5 border rounded-md border-neutral-300 focus:outline-none focus:ring-1 focus:ring-[#10026B]"
                placeholder="2026 / 2027"
              />
            </div>
          </div>

          {/* Card Preview Container */}
          <div className="relative aspect-[85.6/53.98] w-full max-w-xl mx-auto rounded-xl overflow-hidden shadow-lg border-2 border-neutral-200 bg-neutral-100 flex items-center justify-center">
            {loadingPreview && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-black/20 text-white">
                <Loader2 className="w-8 h-8 animate-spin text-white" />
                <span className="text-xs font-medium">Rendering badge preview...</span>
              </div>
            )}
            {previewBlobUrl ? (
              <img
                src={previewBlobUrl}
                alt={`${side} ID Card`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-neutral-400 gap-2">
                <Loader2 className="w-8 h-8 animate-spin text-[#10026B]" />
                <span className="text-xs">Loading badge preview...</span>
              </div>
            )}
          </div>

          {/* Student details summary badge */}
          {student && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-blue-50/50 p-2.5 rounded-lg border border-blue-100">
              <div>
                <span className="text-neutral-500 block">Student:</span>
                <strong className="text-neutral-800 truncate block">{student.full_name}</strong>
              </div>
              <div>
                <span className="text-neutral-500 block">Class:</span>
                <strong className="text-neutral-800 truncate block">{student.class_name || "N/A"}</strong>
              </div>
              <div>
                <span className="text-neutral-500 block">Status:</span>
                <span className="inline-block text-emerald-700 font-semibold">Active</span>
              </div>
              <div>
                <span className="text-neutral-500 block">Standard:</span>
                <span className="text-[#10026B] font-semibold">CR80 (85.6 × 54mm)</span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            Close
          </Button>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={downloading}
              onClick={handlePrint}
              className="flex-1 sm:flex-none border-[#10026B] text-[#10026B] hover:bg-neutral-50"
            >
              <Printer className="w-4 h-4 mr-1.5" />
              Print Badge
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={downloading}
              onClick={handleDownload}
              className="flex-1 sm:flex-none bg-[#10026B] hover:bg-[#1a0a8a] text-white"
            >
              {downloading ? (
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-1.5" />
              )}
              Download PDF
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
