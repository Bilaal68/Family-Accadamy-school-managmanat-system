import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  CreditCard,
  Download,
  Printer,
  Search,
  Upload,
  User,
  RotateCw,
  Loader2,
  CheckCircle,
  FileText,
  Users,
} from "lucide-react";
import toast from "react-hot-toast";

import { fetchClassesList } from "@/api/classes";
import {
  fetchStudents,
  fetchStudentIdCardPreview,
  getStudentIdCardPreviewUrl,
  downloadStudentIdCard,
  downloadBulkIdCards,
  previewCustomIdCard,
  downloadCustomIdCard,
} from "@/api/students";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function IdCardGeneratorPage() {
  const [activeTab, setActiveTab] = useState("select"); // "select" | "manual" | "batch"
  const [side, setSide] = useState("front");
  const [academicYear, setAcademicYear] = useState(
    `${new Date().getFullYear()} / ${new Date().getFullYear() + 1}`
  );

  // Tab 1: Select Student state
  const [studentSearch, setStudentSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedPreviewBlobUrl, setSelectedPreviewBlobUrl] = useState(null);
  const [selectedStudentPreviewLoading, setSelectedStudentPreviewLoading] = useState(false);

  // Tab 2: Manual generator state
  const [manualForm, setManualForm] = useState({
    full_name: "",
    student_id: "STU-00001",
    class_name: "",
    academic_year: `${new Date().getFullYear()} / ${new Date().getFullYear() + 1}`,
    guardian_name: "",
    relationship: "Parent / Guardian",
    emergency_contact: "+251 98 954 3580",
    address: "Addis Ababa, Ethiopia",
  });
  const [manualPhoto, setManualPhoto] = useState(null);
  const [manualPreviewBlobUrl, setManualPreviewBlobUrl] = useState(null);
  const [manualPreviewLoading, setManualPreviewLoading] = useState(false);
  const fileInputRef = useRef(null);

  // Tab 3: Batch state
  const [batchClassId, setBatchClassId] = useState("all");
  const [batchLoading, setBatchLoading] = useState(false);

  // Download loading
  const [downloading, setDownloading] = useState(false);

  // Classes query
  const classesQ = useQuery({
    queryKey: ["classes", "list"],
    queryFn: async () => {
      const res = await fetchClassesList();
      return res.data?.results || res.data || [];
    },
  });

  // Students search query
  const studentsQ = useQuery({
    queryKey: ["students", "search", studentSearch],
    queryFn: async () => {
      const res = await fetchStudents({
        search: studentSearch || undefined,
        page_size: 15,
      });
      return res.data?.results || [];
    },
  });

  // Set default selected student once loaded
  useEffect(() => {
    if (!selectedStudent && studentsQ.data && studentsQ.data.length > 0) {
      setSelectedStudent(studentsQ.data[0]);
    }
  }, [studentsQ.data, selectedStudent]);

  // Load preview blob for selected student (uses Authorization Bearer token header)
  useEffect(() => {
    let active = true;
    if (!selectedStudent) {
      setSelectedPreviewBlobUrl(null);
      return;
    }
    const loadStudentPreview = async () => {
      try {
        setSelectedStudentPreviewLoading(true);
        const res = await fetchStudentIdCardPreview(selectedStudent.id, side, academicYear);
        if (active) {
          const blobUrl = URL.createObjectURL(new Blob([res.data], { type: "image/jpeg" }));
          setSelectedPreviewBlobUrl(blobUrl);
        }
      } catch (err) {
        console.error("Failed to load selected student preview", err);
      } finally {
        if (active) setSelectedStudentPreviewLoading(false);
      }
    };
    loadStudentPreview();
    return () => {
      active = false;
    };
  }, [selectedStudent, side, academicYear]);

  // Handle manual preview generation
  const refreshManualPreview = async () => {
    try {
      setManualPreviewLoading(true);
      const fd = new FormData();
      Object.entries(manualForm).forEach(([k, v]) => {
        fd.append(k, v || "");
      });
      fd.append("side", side);
      if (manualPhoto) {
        fd.append("photo", manualPhoto);
      }
      const res = await previewCustomIdCard(fd);
      const url = URL.createObjectURL(new Blob([res.data], { type: "image/jpeg" }));
      setManualPreviewBlobUrl(url);
    } catch (err) {
      console.error(err);
    } finally {
      setManualPreviewLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "manual") {
      refreshManualPreview();
    }
  }, [activeTab, side, manualForm.student_id, manualForm.full_name, manualForm.class_name, manualPhoto]);

  // Handlers for Tab 1 (Select Student)
  const handleSelectDownload = async () => {
    if (!selectedStudent) return;
    try {
      setDownloading(true);
      const res = await downloadStudentIdCard(selectedStudent.id, academicYear);
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ID_Card_${selectedStudent.student_id || selectedStudent.full_name}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Student ID Card downloaded!");
    } catch (e) {
      toast.error("Failed to download ID Card");
    } finally {
      setDownloading(false);
    }
  };

  const handleSelectPrint = async () => {
    if (!selectedStudent) return;
    try {
      setDownloading(true);
      const res = await downloadStudentIdCard(selectedStudent.id, academicYear);
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const win = window.open(url);
      if (win) win.focus();
    } catch (e) {
      toast.error("Failed to open print preview");
    } finally {
      setDownloading(false);
    }
  };

  // Handlers for Tab 2 (Manual)
  const handleManualDownload = async () => {
    try {
      setDownloading(true);
      const fd = new FormData();
      Object.entries(manualForm).forEach(([k, v]) => {
        fd.append(k, v || "");
      });
      if (manualPhoto) fd.append("photo", manualPhoto);
      const res = await downloadCustomIdCard(fd);
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ID_Card_${manualForm.student_id || "Custom"}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Custom ID Card downloaded!");
    } catch (e) {
      toast.error("Failed to generate custom ID card");
    } finally {
      setDownloading(false);
    }
  };

  const handleManualPrint = async () => {
    try {
      setDownloading(true);
      const fd = new FormData();
      Object.entries(manualForm).forEach(([k, v]) => {
        fd.append(k, v || "");
      });
      if (manualPhoto) fd.append("photo", manualPhoto);
      const res = await downloadCustomIdCard(fd);
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const win = window.open(url);
      if (win) win.focus();
    } catch (e) {
      toast.error("Failed to open print preview");
    } finally {
      setDownloading(false);
    }
  };

  // Handlers for Tab 3 (Batch)
  const handleBatchDownload = async () => {
    try {
      setBatchLoading(true);
      const res = await downloadBulkIdCards({
        classId: batchClassId !== "all" ? batchClassId : undefined,
        academicYear,
      });
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ID_Cards_Print_Sheet_${batchClassId !== "all" ? "Class" : "All"}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Batch ID Card print sheet generated!");
    } catch (e) {
      toast.error("Failed to generate batch ID cards");
    } finally {
      setBatchLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-heading">
            Student ID Card Generator
          </h1>
          <p className="text-sm text-neutral-500">
            Create, preview, customize, and print high-resolution CR80 student identification badges
          </p>
        </div>

        {/* Global Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-white p-1 rounded-lg border shadow-sm">
            <button
              type="button"
              onClick={() => setSide("front")}
              className={`px-3 py-1.5 text-xs font-semibold rounded transition-all ${
                side === "front"
                  ? "bg-[#10026B] text-white shadow-sm"
                  : "text-neutral-600 hover:text-black"
              }`}
            >
              Front Badge
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
              Back Badge
            </button>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-neutral-100 p-1 border">
          <TabsTrigger value="select" className="gap-2 text-xs sm:text-sm font-semibold">
            <User className="h-4 w-4" />
            Select Existing Student
          </TabsTrigger>
          <TabsTrigger value="manual" className="gap-2 text-xs sm:text-sm font-semibold">
            <CreditCard className="h-4 w-4" />
            Manual ID Generator
          </TabsTrigger>
          <TabsTrigger value="batch" className="gap-2 text-xs sm:text-sm font-semibold">
            <Users className="h-4 w-4" />
            Batch Class Generation
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: SELECT EXISTING STUDENT */}
        <TabsContent value="select" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Student Picker Left Column */}
            <div className="lg:col-span-5 space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base text-heading">Choose Student</CardTitle>
                  <CardDescription className="text-xs">
                    Search by student name or student ID number
                  </CardDescription>
                  <div className="relative mt-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                    <Input
                      placeholder="Search student..."
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      className="pl-9 text-sm"
                    />
                  </div>
                </CardHeader>
                <CardContent className="max-h-[460px] overflow-y-auto space-y-1 divide-y divide-neutral-100">
                  {studentsQ.isLoading ? (
                    <div className="py-8 text-center text-xs text-neutral-400 flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-[#10026B]" />
                      Loading students...
                    </div>
                  ) : studentsQ.data?.length === 0 ? (
                    <div className="py-8 text-center text-xs text-neutral-500">
                      No students found matching "{studentSearch}"
                    </div>
                  ) : (
                    studentsQ.data?.map((s) => {
                      const isSelected = selectedStudent?.id === s.id;
                      return (
                        <div
                          key={s.id}
                          onClick={() => setSelectedStudent(s)}
                          className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                            isSelected
                              ? "bg-blue-50/80 border border-blue-200"
                              : "hover:bg-neutral-50"
                          }`}
                        >
                          <div className="min-w-0 pr-2">
                            <p className="font-semibold text-sm text-neutral-900 truncate">
                              {s.full_name}
                            </p>
                            <p className="text-xs text-neutral-500 font-mono">
                              {s.student_id} • {s.class_name || "No class"}
                            </p>
                          </div>
                          {isSelected && (
                            <CheckCircle className="h-4 w-4 text-[#10026B] shrink-0" />
                          )}
                        </div>
                      );
                    })
                  )}
                </CardContent>
              </Card>

              {/* Academic Year Modifier */}
              <Card>
                <CardContent className="pt-4 flex items-center justify-between gap-4">
                  <div>
                    <Label className="text-xs font-semibold">Academic Year</Label>
                    <p className="text-[11px] text-neutral-500">Displayed on the ID card</p>
                  </div>
                  <Input
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    className="w-36 text-xs font-semibold text-right"
                    placeholder="2026 / 2027"
                  />
                </CardContent>
              </Card>
            </div>

            {/* Live Preview & Actions Right Column */}
            <div className="lg:col-span-7 space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <div>
                    <CardTitle className="text-base text-heading">
                      ID Card Preview ({side === "front" ? "Front Side" : "Back Side"})
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Official CR80 Format (85.6mm × 53.98mm) • Large clear typography
                    </CardDescription>
                  </div>
                  {selectedStudent && (
                    <span className="font-mono text-xs font-bold px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-md">
                      {selectedStudent.student_id}
                    </span>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedStudent ? (
                    <div className="relative aspect-[85.6/53.98] w-full max-w-lg mx-auto rounded-xl overflow-hidden shadow-xl border-2 border-neutral-200 bg-neutral-100 flex items-center justify-center">
                      {selectedStudentPreviewLoading && (
                        <div className="absolute inset-0 z-10 bg-black/20 flex flex-col items-center justify-center gap-2 text-white">
                          <Loader2 className="w-8 h-8 animate-spin text-white" />
                          <span className="text-xs font-medium">Generating preview...</span>
                        </div>
                      )}
                      {selectedPreviewBlobUrl ? (
                        <img
                          src={selectedPreviewBlobUrl}
                          alt="Badge Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-neutral-400 gap-2">
                          <Loader2 className="w-8 h-8 animate-spin text-[#10026B]" />
                          <span className="text-xs">Loading badge...</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="aspect-[85.6/53.98] w-full max-w-lg mx-auto rounded-xl border-2 border-dashed border-neutral-200 flex flex-col items-center justify-center text-neutral-400 gap-2">
                      <CreditCard className="w-10 h-10 stroke-1" />
                      <span className="text-xs">Select a student on the left to preview badge</span>
                    </div>
                  )}

                  {selectedStudent && (
                    <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={downloading}
                        onClick={handleSelectPrint}
                        className="w-full sm:w-auto border-[#10026B] text-[#10026B] hover:bg-neutral-50"
                      >
                        <Printer className="w-4 h-4 mr-2" />
                        Print Badge
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        disabled={downloading}
                        onClick={handleSelectDownload}
                        className="w-full sm:w-auto bg-[#10026B] hover:bg-[#1a0a8a] text-white"
                      >
                        {downloading ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Download className="w-4 h-4 mr-2" />
                        )}
                        Download Printable PDF
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* TAB 2: MANUAL ID GENERATOR */}
        <TabsContent value="manual" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Form Fields Left Column */}
            <div className="lg:col-span-5 space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base text-heading">Enter Custom Student Data</CardTitle>
                  <CardDescription className="text-xs">
                    Manually create and print an ID card with custom information and photo
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-xs font-semibold">Student Full Name *</Label>
                    <Input
                      placeholder="e.g. Abebe Bikila Chala"
                      value={manualForm.full_name}
                      onChange={(e) => setManualForm({ ...manualForm, full_name: e.target.value })}
                      className="mt-1 text-sm font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs font-semibold">Student ID *</Label>
                      <Input
                        placeholder="STU-00123"
                        value={manualForm.student_id}
                        onChange={(e) => setManualForm({ ...manualForm, student_id: e.target.value })}
                        className="mt-1 text-sm font-mono font-semibold"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">Class / Grade *</Label>
                      <Input
                        placeholder="Grade 8 - Sec A"
                        value={manualForm.class_name}
                        onChange={(e) => setManualForm({ ...manualForm, class_name: e.target.value })}
                        className="mt-1 text-sm font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs font-semibold">Academic Year</Label>
                    <Input
                      placeholder="2026 / 2027"
                      value={manualForm.academic_year}
                      onChange={(e) => setManualForm({ ...manualForm, academic_year: e.target.value })}
                      className="mt-1 text-sm"
                    />
                  </div>

                  {/* Student Photo File Upload */}
                  <div>
                    <Label className="text-xs font-semibold">Student Photo</Label>
                    <div className="mt-1 flex items-center gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-xs flex items-center gap-1.5"
                      >
                        <Upload className="h-3.5 w-3.5" />
                        Choose Photo
                      </Button>
                      <span className="text-xs text-neutral-500 truncate max-w-[200px]">
                        {manualPhoto ? manualPhoto.name : "No file chosen"}
                      </span>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setManualPhoto(e.target.files[0]);
                        }
                      }}
                    />
                  </div>

                  <hr className="my-2" />
                  <p className="text-xs font-bold text-neutral-700">Back Side Information</p>

                  <div>
                    <Label className="text-xs font-semibold">Guardian Name</Label>
                    <Input
                      placeholder="Guardian or Parent Name"
                      value={manualForm.guardian_name}
                      onChange={(e) => setManualForm({ ...manualForm, guardian_name: e.target.value })}
                      className="mt-1 text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs font-semibold">Relationship</Label>
                      <Input
                        placeholder="Father / Mother / Guardian"
                        value={manualForm.relationship}
                        onChange={(e) => setManualForm({ ...manualForm, relationship: e.target.value })}
                        className="mt-1 text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">Emergency Phone</Label>
                      <Input
                        placeholder="+251 91 123 4567"
                        value={manualForm.emergency_contact}
                        onChange={(e) => setManualForm({ ...manualForm, emergency_contact: e.target.value })}
                        className="mt-1 text-sm font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs font-semibold">Address / City</Label>
                    <Input
                      placeholder="Addis Ababa, Bole Subcity"
                      value={manualForm.address}
                      onChange={(e) => setManualForm({ ...manualForm, address: e.target.value })}
                      className="mt-1 text-sm"
                    />
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={refreshManualPreview}
                    className="w-full mt-2 text-xs flex items-center justify-center gap-1.5"
                  >
                    <RotateCw className="h-3.5 w-3.5" />
                    Update Live Preview
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Live Preview & Actions Right Column */}
            <div className="lg:col-span-7 space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <div>
                    <CardTitle className="text-base text-heading">
                      Manual ID Preview ({side === "front" ? "Front Side" : "Back Side"})
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Updates dynamically as you edit the fields on the left
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative aspect-[85.6/53.98] w-full max-w-lg mx-auto rounded-xl overflow-hidden shadow-xl border-2 border-neutral-200 bg-neutral-100 flex items-center justify-center">
                    {manualPreviewLoading && (
                      <div className="absolute inset-0 z-10 bg-black/20 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-white" />
                      </div>
                    )}
                    {manualPreviewBlobUrl ? (
                      <img
                        src={manualPreviewBlobUrl}
                        alt="Custom Badge Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-neutral-400 gap-2">
                        <Loader2 className="w-8 h-8 animate-spin text-[#10026B]" />
                        <span className="text-xs">Generating preview...</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={downloading}
                      onClick={handleManualPrint}
                      className="w-full sm:w-auto border-[#10026B] text-[#10026B] hover:bg-neutral-50"
                    >
                      <Printer className="w-4 h-4 mr-2" />
                      Print Badge
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      disabled={downloading}
                      onClick={handleManualDownload}
                      className="w-full sm:w-auto bg-[#10026B] hover:bg-[#1a0a8a] text-white"
                    >
                      {downloading ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4 mr-2" />
                      )}
                      Download Custom PDF
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* TAB 3: BATCH GENERATION */}
        <TabsContent value="batch" className="mt-4">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-lg text-heading">Batch ID Card Generation</CardTitle>
              <CardDescription className="text-xs">
                Generate an A4 Print & Cut sheet containing front and back ID cards for all students in a class.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Select Class</Label>
                <Select value={batchClassId} onValueChange={setBatchClassId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All classes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Classes (Whole School)</SelectItem>
                    {classesQ.data?.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold">Academic Year</Label>
                <Input
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  placeholder="2026 / 2027"
                />
              </div>

              <div className="rounded-lg bg-blue-50/60 p-4 border border-blue-100 space-y-2">
                <p className="text-xs font-bold text-[#10026B] flex items-center gap-1.5">
                  <FileText className="w-4 h-4" />
                  Print Sheet Specification
                </p>
                <ul className="text-xs text-neutral-600 space-y-1 list-disc list-inside">
                  <li>Standard A4 multi-page document formatted for color printing.</li>
                  <li>Side-by-side layout: Card Front and Back paired with alignment border guidelines.</li>
                  <li>High-resolution 300 DPI rendering with verified photos & QR verification tags.</li>
                </ul>
              </div>

              <Button
                type="button"
                disabled={batchLoading}
                onClick={handleBatchDownload}
                className="w-full bg-[#10026B] hover:bg-[#1a0a8a] text-white py-2.5 text-sm font-semibold flex items-center justify-center gap-2"
              >
                {batchLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                Generate & Download Multi-Student PDF
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
