import { useQuery } from "@tanstack/react-query";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  parseISO,
  startOfMonth,
  subMonths,
} from "date-fns";
import { ArrowLeft, ChevronLeft, ChevronRight, Calendar, BookOpen, AlertCircle, User, Printer, FileText, Download, ExternalLink } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import {
  fetchStudentAttendance,
  fetchStudentGrades,
  fetchStudentRemarks,
  getStudent,
} from "@/api/students";
import client from "@/api/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SectionError from "@/components/shared/SectionError";
import { ListSkeleton } from "@/components/shared/SectionSkeleton";

import StudentAvatar from "./StudentAvatar";

const GENDER_LABELS = { M: "Male", F: "Female", OTHER: "Other" };
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function statusColor(status) {
  if (status === "PRESENT") return "bg-green-500";
  if (status === "ABSENT") return "bg-red-500";
  if (status === "LATE") return "bg-amber-500";
  return "bg-neutral-100";
}

function gradeStatus(row) {
  if (row.approved_at) return { label: "Approved", className: "bg-green-100 text-green-800" };
  if (row.submitted_at) return { label: "Pending", className: "bg-amber-100 text-amber-800" };
  return { label: "Draft", className: "bg-neutral-200 text-neutral-700" };
}

function AttendanceHeatmap({ records, month }) {
  const { cells, monthLabel } = useMemo(() => {
    const start = startOfMonth(month);
    const end = endOfMonth(month);
    const days = eachDayOfInterval({ start, end });
    const leading = getDay(start);
    const padded = [...Array(leading).fill(null), ...days];
    return {
      cells: padded,
      monthLabel: format(month, "MMMM yyyy"),
    };
  }, [records, month]);

  return (
    <div>
      <p className="mb-3 text-sm font-medium text-black">{monthLabel}</p>
      <div className="mb-2 grid grid-cols-7 gap-1 text-center text-xs text-neutral-500">
        {WEEKDAYS.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (!day) {
            return <div key={`pad-${i}`} className="aspect-square" />;
          }
          const key = format(day, "yyyy-MM-dd");
          const status = records?.find((r) => r.date === key)?.status;
          return (
            <div
              key={key}
              title={status ? `${key}: ${status}` : key}
              className={`aspect-square rounded-sm ${statusColor(status)}`}
            />
          );
        })}
      </div>
      <div className="mt-4 flex flex-wrap gap-4 text-xs text-neutral-600">
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded-sm bg-green-500" /> Present
        </span>
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded-sm bg-red-500" /> Absent
        </span>
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded-sm bg-amber-500" /> Late
        </span>
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded-sm bg-neutral-100" /> No record
        </span>
      </div>
    </div>
  );
}

export default function StudentDetail() {
  const { id } = useParams();
  const [heatmapMonth, setHeatmapMonth] = useState(() => startOfMonth(new Date()));

  const studentQ = useQuery({
    queryKey: ["student", id],
    queryFn: async () => {
      const { data } = await getStudent(id);
      return data;
    },
  });

  const attendanceQ = useQuery({
    queryKey: ["student", id, "attendance"],
    queryFn: async () => {
      const { data } = await fetchStudentAttendance(id);
      return Array.isArray(data) ? data : [];
    },
  });

  const gradesQ = useQuery({
    queryKey: ["student", id, "grades"],
    queryFn: async () => {
      const { data } = await fetchStudentGrades(id);
      return Array.isArray(data) ? data : [];
    },
  });

  const remarksQ = useQuery({
    queryKey: ["student", id, "remarks"],
    queryFn: async () => {
      const { data } = await fetchStudentRemarks(id);
      return Array.isArray(data) ? data : [];
    },
  });

  // Fetch behaviour data
  const behaviourQ = useQuery({
    queryKey: ["student", id, "behaviour"],
    queryFn: async () => {
      const { data } = await client.get(`/behaviour/?student=${id}`);
      return data?.results || data || [];
    },
  });

  // Fetch enrollment data
  const enrollmentQ = useQuery({
    queryKey: ["student", id, "enrollment"],
    queryFn: async () => {
      try {
        const { data } = await client.get(`/enrollment/?student=${id}`);
        // Return the first enrollment (should be only one per student)
        return data?.results?.[0] || data?.[0] || null;
      } catch (error) {
        // If no enrollment found, return null (student was manually registered)
        return null;
      }
    },
  });

  const monthAttendance = useMemo(() => {
    if (!attendanceQ.data) return [];
    const start = format(startOfMonth(heatmapMonth), "yyyy-MM-dd");
    const end = format(endOfMonth(heatmapMonth), "yyyy-MM-dd");
    return attendanceQ.data.filter((r) => r.date >= start && r.date <= end);
  }, [attendanceQ.data, heatmapMonth]);

  if (studentQ.isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-neutral-200" />
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="h-80 animate-pulse rounded-lg bg-neutral-200" />
          <div className="h-80 animate-pulse rounded-lg bg-neutral-200" />
        </div>
      </div>
    );
  }

  if (studentQ.isError) {
    return (
      <SectionError
        message="Could not load student."
        onRetry={() => studentQ.refetch()}
      />
    );
  }

  const student = studentQ.data;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          to="/admin/students"
          className="inline-flex items-center gap-1 text-sm text-neutral-600 hover:text-black"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to students
        </Link>
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.print()}
          className="flex items-center gap-2 border-[#10026B] text-[#10026B] hover:bg-[#10026B] hover:text-white"
        >
          <Printer className="w-4 h-4" />
          Print Profile
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <Card className="border-[#E5E5E5] bg-white h-fit">
          <CardContent className="flex flex-col items-center pt-8 text-center">
            <StudentAvatar
              photo={student.photo}
              name={student.full_name}
              className="h-32 w-32"
            />
            <p className="mt-4 font-mono text-sm text-neutral-500">{student.student_id}</p>
            <h1 className="text-xl font-semibold text-black">{student.full_name}</h1>
            <span
              className={`mt-3 px-3 py-1 rounded-full text-xs font-semibold ${
                student.is_active
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-600"
              }`}
            >
              {student.is_active ? "Active" : "Inactive"}
            </span>
            <dl className="mt-6 w-full space-y-3 text-left text-sm">
              <div className="flex justify-between gap-2">
                <dt className="text-neutral-500">Class</dt>
                <dd className="font-medium text-black">{student.class_name || "Not assigned"}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-neutral-500">Date of birth</dt>
                <dd className="font-medium text-black">
                  {student.date_of_birth
                    ? format(parseISO(student.date_of_birth), "MMM d, yyyy")
                    : "—"}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-neutral-500">Gender</dt>
                <dd className="font-medium text-black">
                  {GENDER_LABELS[student.gender] || student.gender}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-neutral-500">Enrolled</dt>
                <dd className="font-medium text-black">
                  {student.enrolled_at
                    ? format(parseISO(student.enrolled_at), "MMM d, yyyy")
                    : "—"}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card className="border-[#E5E5E5] bg-white">
          <CardHeader>
            <CardTitle>Student Information</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="profile">
              <TabsList className="mb-4 bg-neutral-100 flex-wrap h-auto">
                <TabsTrigger value="profile">👤 Profile</TabsTrigger>
                <TabsTrigger value="attendance">📅 Attendance</TabsTrigger>
                <TabsTrigger value="grades">📊 Grades</TabsTrigger>
                <TabsTrigger value="behaviour">⚠️ Behaviour</TabsTrigger>
                <TabsTrigger value="parents">👨‍👩‍👧 Parents</TabsTrigger>
                <TabsTrigger value="enrollment">🎓 Enrollment Info</TabsTrigger>
                <TabsTrigger value="remarks">💬 Remarks</TabsTrigger>
              </TabsList>

              <TabsContent value="profile" className="space-y-4">
                <ProfileTabContent student={student} />
              </TabsContent>

              <TabsContent value="attendance" className="space-y-4">
                <AttendanceTabContent
                  attendanceQ={attendanceQ}
                  monthAttendance={monthAttendance}
                  heatmapMonth={heatmapMonth}
                  setHeatmapMonth={setHeatmapMonth}
                />
              </TabsContent>

              <TabsContent value="grades">
                <GradesTabContent gradesQ={gradesQ} />
              </TabsContent>

              <TabsContent value="behaviour">
                <BehaviourTabContent behaviourQ={behaviourQ} />
              </TabsContent>

              <TabsContent value="parents">
                <ParentsTabContent student={student} />
              </TabsContent>

              <TabsContent value="enrollment">
                <EnrollmentTabContent enrollmentQ={enrollmentQ} />
              </TabsContent>

              <TabsContent value="remarks">
                <RemarksTabContent remarksQ={remarksQ} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


// Profile Tab Content
function ProfileTabContent({ student }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {[
        { label: "Full Name", value: student.full_name },
        {
          label: "Gender",
          value: GENDER_LABELS[student.gender] || student.gender,
        },
        {
          label: "Date of Birth",
          value: student.date_of_birth
            ? format(parseISO(student.date_of_birth), "dd MMM yyyy")
            : "—",
        },
        {
          label: "Current Class",
          value: student.class_name || "Not assigned",
        },
        {
          label: "Enrolled",
          value: student.enrolled_at
            ? format(parseISO(student.enrolled_at), "dd MMM yyyy")
            : "—",
        },
        { label: "Student ID", value: student.student_id },
      ].map((item) => (
        <div
          key={item.label}
          className="bg-gray-50 rounded-lg p-3 border border-gray-100"
        >
          <p className="text-xs text-gray-500 mb-1">{item.label}</p>
          <p className="font-semibold text-[#10026B] text-sm">
            {item.value || "—"}
          </p>
        </div>
      ))}
    </div>
  );
}

// Attendance Tab Content
function AttendanceTabContent({ attendanceQ, monthAttendance, heatmapMonth, setHeatmapMonth }) {
  const records = attendanceQ.data || [];
  const present = records.filter((r) => r.status === "PRESENT").length;
  const absent = records.filter((r) => r.status === "ABSENT").length;
  const late = records.filter((r) => r.status === "LATE").length;
  const percentage =
    records.length > 0 ? ((present / records.length) * 100).toFixed(1) : 0;

  return (
    <>
      {attendanceQ.isLoading && <ListSkeleton items={4} />}
      {attendanceQ.isError && (
        <SectionError
          message="Could not load attendance."
          onRetry={() => attendanceQ.refetch()}
        />
      )}
      {!attendanceQ.isLoading && !attendanceQ.isError && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-xs text-green-600 font-medium mb-1">Present</p>
              <p className="text-2xl font-bold text-green-700">{present}</p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-xs text-red-600 font-medium mb-1">Absent</p>
              <p className="text-2xl font-bold text-red-700">{absent}</p>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-xs text-amber-600 font-medium mb-1">Late</p>
              <p className="text-2xl font-bold text-amber-700">{late}</p>
            </div>
            <div className="bg-[#10026B]/5 border border-[#10026B]/20 rounded-lg p-4">
              <p className="text-xs text-[#10026B] font-medium mb-1">Rate</p>
              <p className="text-2xl font-bold text-[#10026B]">{percentage}%</p>
            </div>
          </div>

          {/* Heatmap */}
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
                setHeatmapMonth((m) => subMonths(startOfMonth(m), 1))
              }
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
                setHeatmapMonth((m) => addMonths(startOfMonth(m), 1))
              }
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <AttendanceHeatmap records={monthAttendance} month={heatmapMonth} />
        </>
      )}
    </>
  );
}

// Grades Tab Content
function GradesTabContent({ gradesQ }) {
  const grades = gradesQ.data || [];

  // Group grades by subject
  const gradesBySubject = grades.reduce((acc, grade) => {
    if (!acc[grade.subject]) {
      acc[grade.subject] = {};
    }
    acc[grade.subject][grade.semester] = grade;
    return acc;
  }, {});

  const subjects = Object.keys(gradesBySubject);

  // Calculate overall average
  const approvedGrades = grades.filter((g) => g.approved_at);
  const overallAverage =
    approvedGrades.length > 0
      ? (
          approvedGrades.reduce((sum, g) => sum + g.score, 0) /
          approvedGrades.length
        ).toFixed(1)
      : 0;

  return (
    <>
      {gradesQ.isLoading && <ListSkeleton items={4} />}
      {gradesQ.isError && (
        <SectionError
          message="Could not load grades."
          onRetry={() => gradesQ.refetch()}
        />
      )}
      {!gradesQ.isLoading && !gradesQ.isError && (
        <>
          {subjects.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No grades recorded yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left p-3 text-sm font-semibold text-gray-700 border-b">
                      Subject
                    </th>
                    <th className="text-center p-3 text-sm font-semibold text-gray-700 border-b">
                      Semester 1
                    </th>
                    <th className="text-center p-3 text-sm font-semibold text-gray-700 border-b">
                      Semester 2
                    </th>
                    <th className="text-center p-3 text-sm font-semibold text-gray-700 border-b">
                      Final
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {subjects.map((subject) => {
                    const sem1 = gradesBySubject[subject]["SEMESTER_1"];
                    const sem2 = gradesBySubject[subject]["SEMESTER_2"];
                    const scores = [sem1?.score, sem2?.score].filter(Boolean);
                    const final =
                      scores.length > 0
                        ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)
                        : "—";

                    return (
                      <tr key={subject} className="border-b">
                        <td className="p-3 font-medium text-sm">{subject}</td>
                        <td className="p-3 text-center">
                          {sem1 ? (
                            <div className="flex flex-col items-center gap-1">
                              <span className="font-semibold">{sem1.score}</span>
                              <span
                                className={`text-xs px-2 py-0.5 rounded-full ${
                                  sem1.approved_at
                                    ? "bg-green-100 text-green-700"
                                    : "bg-amber-100 text-amber-700"
                                }`}
                              >
                                {sem1.approved_at ? "Approved" : "Pending"}
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          {sem2 ? (
                            <div className="flex flex-col items-center gap-1">
                              <span className="font-semibold">{sem2.score}</span>
                              <span
                                className={`text-xs px-2 py-0.5 rounded-full ${
                                  sem2.approved_at
                                    ? "bg-green-100 text-green-700"
                                    : "bg-amber-100 text-amber-700"
                                }`}
                              >
                                {sem2.approved_at ? "Approved" : "Pending"}
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="p-3 text-center font-bold text-[#10026B]">
                          {final}
                        </td>
                      </tr>
                    );
                  })}
                  <tr className="bg-[#10026B] text-white font-bold">
                    <td className="p-3">Overall Average</td>
                    <td className="p-3 text-center">—</td>
                    <td className="p-3 text-center">—</td>
                    <td className="p-3 text-center text-lg">{overallAverage}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </>
  );
}

// Behaviour Tab Content
function BehaviourTabContent({ behaviourQ }) {
  const reports = behaviourQ.data || [];
  const sortedReports = [...reports].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );

  return (
    <>
      {behaviourQ.isLoading && <ListSkeleton items={4} />}
      {behaviourQ.isError && (
        <SectionError
          message="Could not load behaviour reports."
          onRetry={() => behaviourQ.refetch()}
        />
      )}
      {!behaviourQ.isLoading && !behaviourQ.isError && (
        <>
          {sortedReports.length === 0 ? (
            <div className="text-center py-12 bg-green-50 border border-green-200 rounded-lg">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-3xl">✓</span>
              </div>
              <p className="text-green-700 font-medium">
                No behaviour reports — great student!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedReports.map((report) => (
                <div
                  key={report.id}
                  className="p-4 bg-white border border-gray-200 rounded-lg"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-700">
                        {format(parseISO(report.date), "dd MMM yyyy")}
                      </span>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        report.severity === "HIGH"
                          ? "bg-red-100 text-red-700"
                          : report.severity === "MEDIUM"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {report.severity}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{report.description}</p>
                  <p className="text-xs text-gray-400">
                    Reported by {report.reported_by_name || "Teacher"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
}

// Parents Tab Content
function ParentsTabContent({ student }) {
  const parents = student.parents || [];
  const enrollment = student.enrollment || {};

  // Build fallback parent list from enrollment data
  const enrollmentParents = [];
  if (enrollment.father_name) {
    enrollmentParents.push({
      full_name: enrollment.father_name,
      relationship: "Father",
      phone: enrollment.father_phone,
      occupation: enrollment.father_occupation,
    });
  }
  if (enrollment.mother_name) {
    enrollmentParents.push({
      full_name: enrollment.mother_name,
      relationship: "Mother",
      phone: enrollment.mother_phone,
      occupation: enrollment.mother_occupation,
    });
  }
  if (enrollment.guardian_name) {
    enrollmentParents.push({
      full_name: enrollment.guardian_name,
      relationship: enrollment.guardian_relationship || "Guardian",
      phone: enrollment.guardian_phone,
      occupation: null,
    });
  }

  return (
    <>
      {parents.length === 0 ? (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-amber-700 font-medium mb-1">No parents linked yet</p>
            <p className="text-sm text-amber-600">
              Contact admin to link parent/guardian accounts
            </p>
          </div>

          {enrollmentParents.length > 0 && (
            <div>
              <h4 className="font-bold text-[#10026B] mb-3 text-sm uppercase tracking-wide">
                Contact Information from Enrollment
              </h4>
              <div className="space-y-3">
                {enrollmentParents.map((parent, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-gray-50 rounded-xl p-4 border border-gray-100"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#10026B]/10 flex items-center justify-center">
                        <span className="text-[#10026B] font-bold text-sm">
                          {parent.full_name?.charAt(0) || "?"}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800 text-sm">
                          {parent.full_name}
                        </p>
                        <p className="text-xs text-gray-400">
                          {parent.relationship}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-[#10026B]">
                        {parent.phone || "—"}
                      </p>
                      {parent.occupation && parent.occupation !== "—" && (
                        <p className="text-xs text-gray-400">{parent.occupation}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left p-3 text-sm font-semibold text-gray-700 border-b">
                  Name
                </th>
                <th className="text-left p-3 text-sm font-semibold text-gray-700 border-b">
                  Relationship
                </th>
                <th className="text-left p-3 text-sm font-semibold text-gray-700 border-b">
                  Phone
                </th>
                <th className="text-center p-3 text-sm font-semibold text-gray-700 border-b">
                  Primary Contact
                </th>
              </tr>
            </thead>
            <tbody>
              {parents.map((parent) => (
                <tr key={parent.id} className="border-b">
                  <td className="p-3 font-medium text-sm">{parent.full_name}</td>
                  <td className="p-3 text-sm text-gray-600">
                    {parent.relationship}
                  </td>
                  <td className="p-3 text-sm text-gray-600">
                    {parent.phone || "—"}
                  </td>
                  <td className="p-3 text-center">
                    {parent.is_primary ? (
                      <span className="inline-block px-3 py-1 bg-[#10026B] text-white text-xs font-semibold rounded-full">
                        Primary
                      </span>
                    ) : (
                      <span className="text-gray-400 text-sm">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

// Remarks Tab Content
function RemarksTabContent({ remarksQ }) {
  return (
    <>
      {remarksQ.isLoading && <ListSkeleton items={4} />}
      {remarksQ.isError && (
        <SectionError
          message="Could not load remarks."
          onRetry={() => remarksQ.refetch()}
        />
      )}
      {!remarksQ.isLoading && !remarksQ.isError && (
        <>
          {remarksQ.data.length === 0 ? (
            <p className="py-8 text-center text-sm text-neutral-500">
              No remarks or behaviour notes yet.
            </p>
          ) : (
            <ul className="space-y-4">
              {remarksQ.data.map((note) => (
                <li
                  key={note.id}
                  className="rounded-md border border-[#E5E5E5] p-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="outline">
                      {note.note_type === "BEHAVIOUR" ? "Behaviour" : "Remark"}
                    </Badge>
                    <span className="text-xs text-neutral-500">
                      {note.created_at
                        ? format(parseISO(note.created_at), "MMM d, yyyy")
                        : ""}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-black">{note.content}</p>
                  {note.author_name && (
                    <p className="mt-1 text-xs text-neutral-500">
                      — {note.author_name}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </>
  );
}

// Enrollment Tab Content
function EnrollmentTabContent({ enrollmentQ }) {
  const enrollment = enrollmentQ.data;

  return (
    <>
      {enrollmentQ.isLoading && <ListSkeleton items={6} />}
      {enrollmentQ.isError && (
        <SectionError
          message="Could not load enrollment information."
          onRetry={() => enrollmentQ.refetch()}
        />
      )}
      {!enrollmentQ.isLoading && !enrollmentQ.isError && (
        <>
          {!enrollment ? (
            <div className="text-center py-12 bg-blue-50 border border-blue-200 rounded-lg">
              <FileText className="w-12 h-12 text-blue-400 mx-auto mb-3" />
              <p className="text-blue-700 font-medium mb-2">
                Student was registered manually
              </p>
              <p className="text-sm text-blue-600">
                No enrollment application record found
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Enrollment Status */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div>
                  <p className="text-sm text-gray-500">Application Status</p>
                  <p className="font-semibold text-lg">
                    <span
                      className={`px-3 py-1 rounded-full text-sm ${
                        enrollment.status === "APPROVED"
                          ? "bg-green-100 text-green-700"
                          : enrollment.status === "REVIEWED"
                          ? "bg-blue-100 text-blue-700"
                          : enrollment.status === "REJECTED"
                          ? "bg-red-100 text-red-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {enrollment.status}
                    </span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Admission Number</p>
                  <p className="font-mono font-semibold text-[#10026B]">
                    {enrollment.admission_number}
                  </p>
                </div>
              </div>

              {/* Student Information */}
              <div>
                <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Student Information
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    { label: "First Name", value: enrollment.first_name },
                    { label: "Middle Name", value: enrollment.middle_name || "—" },
                    { label: "Last Name", value: enrollment.last_name },
                    { label: "Full Name", value: enrollment.full_name },
                    {
                      label: "Gender",
                      value: enrollment.gender === "M" ? "Male" : enrollment.gender === "F" ? "Female" : "Other",
                    },
                    {
                      label: "Date of Birth",
                      value: enrollment.date_of_birth
                        ? format(parseISO(enrollment.date_of_birth), "dd MMM yyyy")
                        : "—",
                    },
                    { label: "Nationality", value: enrollment.nationality || "—" },
                    { label: "Student Type", value: enrollment.student_type || "—" },
                    {
                      label: "Previous School",
                      value: enrollment.previous_school || "—",
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="bg-white rounded-lg p-3 border border-gray-100"
                    >
                      <p className="text-xs text-gray-400 mb-1">{item.label}</p>
                      <p className="font-medium text-gray-700 text-sm">
                        {item.value || "—"}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Academic Information */}
              <div>
                <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Academic Information
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    { label: "Academic Year", value: enrollment.academic_year },
                    { label: "Grade Applying", value: enrollment.grade_applying },
                    {
                      label: "Enrollment Date",
                      value: enrollment.enrollment_date
                        ? format(parseISO(enrollment.enrollment_date), "dd MMM yyyy")
                        : "—",
                    },
                    {
                      label: "Transfer Student",
                      value: enrollment.is_transfer ? "Yes" : "No",
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="bg-white rounded-lg p-3 border border-gray-100"
                    >
                      <p className="text-xs text-gray-400 mb-1">{item.label}</p>
                      <p className="font-medium text-gray-700 text-sm">
                        {item.value || "—"}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Father Information */}
              <div>
                <h3 className="font-semibold text-gray-700 mb-3">
                  Father Information
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    { label: "Father Name", value: enrollment.father_name },
                    { label: "Father Phone", value: enrollment.father_phone || "—" },
                    {
                      label: "Father Occupation",
                      value: enrollment.father_occupation || "—",
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="bg-white rounded-lg p-3 border border-gray-100"
                    >
                      <p className="text-xs text-gray-400 mb-1">{item.label}</p>
                      <p className="font-medium text-gray-700 text-sm">
                        {item.value || "—"}
                      </p>
                    </div>
                  ))}
                  {enrollment.father_photo_url && (
                    <div className="bg-white rounded-lg p-3 border border-gray-100">
                      <p className="text-xs text-gray-400 mb-2">Father Photo</p>
                      <a
                        href={enrollment.father_photo_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-[#10026B] hover:underline text-sm"
                      >
                        <ExternalLink className="w-4 h-4" />
                        View Photo
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Mother Information */}
              <div>
                <h3 className="font-semibold text-gray-700 mb-3">
                  Mother Information
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    { label: "Mother Name", value: enrollment.mother_name },
                    { label: "Mother Phone", value: enrollment.mother_phone || "—" },
                    {
                      label: "Mother Occupation",
                      value: enrollment.mother_occupation || "—",
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="bg-white rounded-lg p-3 border border-gray-100"
                    >
                      <p className="text-xs text-gray-400 mb-1">{item.label}</p>
                      <p className="font-medium text-gray-700 text-sm">
                        {item.value || "—"}
                      </p>
                    </div>
                  ))}
                  {enrollment.mother_photo_url && (
                    <div className="bg-white rounded-lg p-3 border border-gray-100">
                      <p className="text-xs text-gray-400 mb-2">Mother Photo</p>
                      <a
                        href={enrollment.mother_photo_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-[#10026B] hover:underline text-sm"
                      >
                        <ExternalLink className="w-4 h-4" />
                        View Photo
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Guardian Information (if applicable) */}
              {enrollment.guardian_name && (
                <div>
                  <h3 className="font-semibold text-gray-700 mb-3">
                    Guardian Information
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {[
                      { label: "Guardian Name", value: enrollment.guardian_name },
                      {
                        label: "Relationship",
                        value: enrollment.guardian_relationship || "—",
                      },
                      {
                        label: "Guardian Phone",
                        value: enrollment.guardian_phone || "—",
                      },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="bg-white rounded-lg p-3 border border-gray-100"
                      >
                        <p className="text-xs text-gray-400 mb-1">{item.label}</p>
                        <p className="font-medium text-gray-700 text-sm">
                          {item.value || "—"}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Address Information */}
              <div>
                <h3 className="font-semibold text-gray-700 mb-3">
                  Address Information
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    { label: "Country", value: enrollment.country || "—" },
                    { label: "Region", value: enrollment.region || "—" },
                    { label: "City", value: enrollment.city || "—" },
                    { label: "Sub City", value: enrollment.sub_city || "—" },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="bg-white rounded-lg p-3 border border-gray-100"
                    >
                      <p className="text-xs text-gray-400 mb-1">{item.label}</p>
                      <p className="font-medium text-gray-700 text-sm">
                        {item.value || "—"}
                      </p>
                    </div>
                  ))}
                  {enrollment.full_address && (
                    <div className="col-span-2 bg-white rounded-lg p-3 border border-gray-100">
                      <p className="text-xs text-gray-400 mb-1">Full Address</p>
                      <p className="font-medium text-gray-700 text-sm">
                        {enrollment.full_address}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Emergency Contact */}
              <div>
                <h3 className="font-semibold text-gray-700 mb-3">
                  Emergency Contact
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    {
                      label: "Contact Name",
                      value: enrollment.emergency_contact_name || "—",
                    },
                    {
                      label: "Relationship",
                      value: enrollment.emergency_contact_relationship || "—",
                    },
                    {
                      label: "Contact Phone",
                      value: enrollment.emergency_contact_phone || "—",
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="bg-white rounded-lg p-3 border border-gray-100"
                    >
                      <p className="text-xs text-gray-400 mb-1">{item.label}</p>
                      <p className="font-medium text-gray-700 text-sm">
                        {item.value || "—"}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Information */}
              {enrollment.payment_status && (
                <div>
                  <h3 className="font-semibold text-gray-700 mb-3">
                    Payment Information
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {[
                      {
                        label: "Payment Status",
                        value: (
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              enrollment.payment_status === "PAID"
                                ? "bg-green-100 text-green-700"
                                : enrollment.payment_status === "PARTIAL"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {enrollment.payment_status}
                          </span>
                        ),
                      },
                      {
                        label: "Amount Paid",
                        value: enrollment.amount_paid
                          ? `${enrollment.amount_paid} ETB`
                          : "—",
                      },
                      {
                        label: "Payment Method",
                        value: enrollment.payment_method || "—",
                      },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="bg-white rounded-lg p-3 border border-gray-100"
                      >
                        <p className="text-xs text-gray-400 mb-1">{item.label}</p>
                        <div className="font-medium text-gray-700 text-sm">
                          {item.value || "—"}
                        </div>
                      </div>
                    ))}
                    {enrollment.fee_receipt_url && (
                      <div className="bg-white rounded-lg p-3 border border-gray-100">
                        <p className="text-xs text-gray-400 mb-2">Fee Receipt</p>
                        <a
                          href={enrollment.fee_receipt_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-[#10026B] hover:underline text-sm"
                        >
                          <Download className="w-4 h-4" />
                          Download Receipt
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Uploaded Documents */}
              {enrollment.documents && enrollment.documents.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Uploaded Documents
                  </h3>
                  <div className="space-y-3">
                    {enrollment.documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:border-[#10026B] transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-[#10026B]/10 rounded-lg">
                            <FileText className="w-5 h-5 text-[#10026B]" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-700">
                              {doc.document_type_label}
                            </p>
                            <p className="text-xs text-gray-500">
                              Uploaded on{" "}
                              {doc.uploaded_at
                                ? format(parseISO(doc.uploaded_at), "dd MMM yyyy")
                                : "—"}
                            </p>
                          </div>
                        </div>
                        <a
                          href={doc.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-4 py-2 bg-[#10026B] text-white rounded-lg hover:bg-[#1a0494] transition-colors text-sm font-medium"
                        >
                          <ExternalLink className="w-4 h-4" />
                          View
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Review Information */}
              <div>
                <h3 className="font-semibold text-gray-700 mb-3">
                  Review & Approval Information
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    {
                      label: "Reviewed By",
                      value: enrollment.reviewed_by_name || "—",
                    },
                    {
                      label: "Reviewed At",
                      value: enrollment.reviewed_at
                        ? format(parseISO(enrollment.reviewed_at), "dd MMM yyyy, HH:mm")
                        : "—",
                    },
                    {
                      label: "Approved By",
                      value: enrollment.approved_by_name || "—",
                    },
                    {
                      label: "Approved At",
                      value: enrollment.approved_at
                        ? format(parseISO(enrollment.approved_at), "dd MMM yyyy, HH:mm")
                        : "—",
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="bg-white rounded-lg p-3 border border-gray-100"
                    >
                      <p className="text-xs text-gray-400 mb-1">{item.label}</p>
                      <p className="font-medium text-gray-700 text-sm">
                        {item.value || "—"}
                      </p>
                    </div>
                  ))}
                  {enrollment.cashier_notes && (
                    <div className="col-span-2 bg-white rounded-lg p-3 border border-gray-100">
                      <p className="text-xs text-gray-400 mb-1">Cashier Notes</p>
                      <p className="font-medium text-gray-700 text-sm">
                        {enrollment.cashier_notes}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Parent Information from Enrollment */}
              <div className="mt-6">
                <h4 className="font-bold text-[#10026B] mb-3 text-sm uppercase tracking-wide">
                  Parent Information from Enrollment
                </h4>
                {enrollment.father_name || enrollment.mother_name || enrollment.guardian_name ? (
                  <div className="space-y-3">
                    {enrollment.father_name && (
                      <div className="flex items-center justify-between bg-gray-50 rounded-xl p-4 border border-gray-100">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#10026B]/10 flex items-center justify-center">
                            <span className="text-[#10026B] font-bold text-sm">
                              {enrollment.father_name?.charAt(0) || "?"}
                            </span>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800 text-sm">
                              {enrollment.father_name}
                            </p>
                            <p className="text-xs text-gray-400">Father</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-[#10026B]">
                            {enrollment.father_phone || "—"}
                          </p>
                          {enrollment.father_occupation && enrollment.father_occupation !== "—" && (
                            <p className="text-xs text-gray-400">{enrollment.father_occupation}</p>
                          )}
                        </div>
                      </div>
                    )}

                    {enrollment.mother_name && (
                      <div className="flex items-center justify-between bg-gray-50 rounded-xl p-4 border border-gray-100">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#10026B]/10 flex items-center justify-center">
                            <span className="text-[#10026B] font-bold text-sm">
                              {enrollment.mother_name?.charAt(0) || "?"}
                            </span>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800 text-sm">
                              {enrollment.mother_name}
                            </p>
                            <p className="text-xs text-gray-400">Mother</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-[#10026B]">
                            {enrollment.mother_phone || "—"}
                          </p>
                          {enrollment.mother_occupation && enrollment.mother_occupation !== "—" && (
                            <p className="text-xs text-gray-400">{enrollment.mother_occupation}</p>
                          )}
                        </div>
                      </div>
                    )}

                    {enrollment.guardian_name && (
                      <div className="flex items-center justify-between bg-gray-50 rounded-xl p-4 border border-gray-100">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#10026B]/10 flex items-center justify-center">
                            <span className="text-[#10026B] font-bold text-sm">
                              {enrollment.guardian_name?.charAt(0) || "?"}
                            </span>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800 text-sm">
                              {enrollment.guardian_name}
                            </p>
                            <p className="text-xs text-gray-400">
                              {enrollment.guardian_relationship || "Guardian"}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-[#10026B]">
                            {enrollment.guardian_phone || "—"}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm">No parent records found</p>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}
