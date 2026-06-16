import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, ChevronRight, Download } from "lucide-react";
import { useRef, useState } from "react";
import toast from "react-hot-toast";

import { bulkImportStudents } from "@/api/students";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const TEMPLATE_CSV = `full_name,date_of_birth,gender,class_id
Jane Doe,2015-03-15,F,
John Smith,2014-07-20,M,
`;

function downloadTemplate() {
  const blob = new Blob([TEMPLATE_CSV], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "students_import_template.csv";
  link.click();
  URL.revokeObjectURL(url);
}

export default function BulkImportModal({ open, onClose }) {
  const inputRef = useRef(null);
  const qc = useQueryClient();
  const [result, setResult] = useState(null);
  const [showFailed, setShowFailed] = useState(false);

  const mutation = useMutation({
    mutationFn: (file) => bulkImportStudents(file).then((res) => res.data),
    onSuccess: (data) => {
      setResult(data);
      qc.invalidateQueries({ queryKey: ["students"] });
      qc.invalidateQueries({ queryKey: ["admin"] });
      const failed = data.failed_rows?.length ?? 0;
      if (failed === 0) {
        toast.success(`${data.success_count} students imported successfully.`);
      }
    },
    onError: (err) => {
      toast.error(err.response?.data?.detail || "Bulk import failed.");
    },
  });

  const handleClose = () => {
    setResult(null);
    setShowFailed(false);
    if (inputRef.current) inputRef.current.value = "";
    onClose();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const file = inputRef.current?.files?.[0];
    if (!file) {
      toast.error("Choose a file first.");
      return;
    }
    const name = file.name.toLowerCase();
    if (!name.endsWith(".csv") && !name.endsWith(".xlsx") && !name.endsWith(".xlsm")) {
      toast.error("Upload a CSV or Excel file.");
      return;
    }
    mutation.mutate(file);
  };

  const failedCount = result?.failed_rows?.length ?? 0;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-[#E5E5E5] bg-white sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Bulk import students</DialogTitle>
          <DialogDescription>
            Upload CSV or Excel. Required columns: full_name, date_of_birth, gender
            (M, F, OTHER), class_id.
          </DialogDescription>
        </DialogHeader>

        {!result ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Button
              type="button"
              variant="outline"
              className="w-full border-black text-black hover:bg-black hover:text-white"
              onClick={downloadTemplate}
            >
              <Download className="mr-2 h-4 w-4" />
              Download template
            </Button>
            <Input ref={inputRef} type="file" accept=".csv,.xlsx,.xlsm" />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                className="border-black text-black hover:bg-black hover:text-white"
                onClick={handleClose}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Uploading…" : "Upload"}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-black">
              <span className="font-semibold">{result.success_count}</span> students
              imported successfully.
              {failedCount > 0 && (
                <>
                  {" "}
                  <span className="font-semibold text-red-600">{failedCount}</span> failed.
                </>
              )}
            </p>

            {failedCount > 0 && (
              <div className="rounded-md border border-[#E5E5E5]">
                <button
                  type="button"
                  className="flex w-full items-center justify-between px-3 py-2 text-sm font-medium"
                  onClick={() => setShowFailed((v) => !v)}
                >
                  Failed rows
                  {showFailed ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
                {showFailed && (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Row</TableHead>
                        <TableHead>Reason</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.failed_rows.map((row, i) => (
                        <TableRow key={`${row.row}-${i}`}>
                          <TableCell>{row.row}</TableCell>
                          <TableCell className="text-red-600">{row.reason}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            )}

            <DialogFooter>
              <Button onClick={handleClose}>Done</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
