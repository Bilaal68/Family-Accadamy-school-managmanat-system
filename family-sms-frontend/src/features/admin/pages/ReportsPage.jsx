import { useState, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { FileText, Download, Filter, Users, CalendarCheck, GraduationCap, Printer } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import apiClient from '../../../api/client'
import toast from 'react-hot-toast'

export default function ReportsPage() {
  const [activeReport, setActiveReport] = useState('performance')
  const printRef = useRef()

  const reportTypes = [
    { id: 'performance', label: 'Student Performance', icon: GraduationCap, description: 'Marks, grades, and averages per student' },
    { id: 'attendance', label: 'Attendance Report', icon: CalendarCheck, description: 'Attendance records and percentages' },
    { id: 'enrollment', label: 'Enrollment Report', icon: Users, description: 'Application status and enrollment stats' },
  ]

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#10026B]">Reports</h1>
          <p className="text-gray-500 text-sm mt-1">Generate and download school reports</p>
        </div>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <Printer className="w-4 h-4" />
          Print Report
        </button>
      </div>

      {/* Report type selector */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {reportTypes.map(report => (
          <button
            key={report.id}
            onClick={() => setActiveReport(report.id)}
            className={`p-5 rounded-2xl border-2 text-left transition-all ${
              activeReport === report.id
                ? 'border-[#10026B] bg-[#10026B]/5'
                : 'border-gray-100 bg-white hover:border-gray-200'
            }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
              activeReport === report.id ? 'bg-[#10026B]' : 'bg-gray-100'
            }`}>
              <report.icon className={`w-5 h-5 ${activeReport === report.id ? 'text-white' : 'text-gray-500'}`} />
            </div>
            <p className={`font-bold text-sm ${activeReport === report.id ? 'text-[#10026B]' : 'text-gray-800'}`}>
              {report.label}
            </p>
            <p className="text-xs text-gray-400 mt-1">{report.description}</p>
          </button>
        ))}
      </div>

      {/* Report content */}
      <div ref={printRef} className="no-print-hide">
        {activeReport === 'performance' && <PerformanceReport />}
        {activeReport === 'attendance' && <AttendanceReport />}
        {activeReport === 'enrollment' && <EnrollmentReport />}
      </div>
    </div>
  )
}

function PerformanceReport() {
  const [filters, setFilters] = useState({ class: '', semester: '' })
  const [applied, setApplied] = useState(false)

  const { data: classes = [] } = useQuery({
    queryKey: ['classes'],
    queryFn: () => apiClient.get('/classes/').then(r => r.data?.results || r.data || [])
  })

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['performance-report', filters],
    queryFn: () => apiClient.get('/grades/performance_report/', { params: filters }).then(r => r.data),
    enabled: applied,
  })

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6">
      <h2 className="font-bold text-[#10026B] text-lg mb-4">Student Performance Report</h2>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6 p-4 bg-gray-50 rounded-xl">
        <select
          value={filters.class}
          onChange={e => setFilters(f => ({ ...f, class: e.target.value }))}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm flex-1 min-w-[160px]"
        >
          <option value="">All Classes</option>
          {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        <select
          value={filters.semester}
          onChange={e => setFilters(f => ({ ...f, semester: e.target.value }))}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm flex-1 min-w-[160px]"
        >
          <option value="">All Semesters</option>
          <option value="SEMESTER_1">Semester 1</option>
          <option value="SEMESTER_2">Semester 2</option>
        </select>

        <button
          onClick={() => { setApplied(true); refetch() }}
          className="bg-[#10026B] text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-[#1a0494] transition-colors"
        >
          Generate Report
        </button>
      </div>

      {/* Results */}
      {isLoading && <div className="text-center py-12 text-gray-400">Generating report...</div>}
      {isError && <div className="text-center py-12 text-red-400">Failed to load report. Try again.</div>}
      {data && (
        <>
          {/* Summary */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">
              <span className="font-bold text-[#10026B]">{data.total_students}</span> students found
              · Generated {format(parseISO(data.generated_at), 'dd MMM yyyy, HH:mm')}
            </p>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#10026B]">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-white uppercase">Student</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-white uppercase">ID</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-white uppercase">Class</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-white uppercase">Average</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-white uppercase">Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.data.map((row, i) => (
                  <tr key={row.student_id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}>
                    <td className="px-4 py-3 font-medium text-sm text-gray-800">{row.student_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-400">{row.student_id_display}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{row.class_name}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`font-bold text-sm ${
                        row.overall_average >= 80 ? 'text-green-600'
                        : row.overall_average >= 60 ? 'text-amber-600'
                        : row.overall_average > 0 ? 'text-red-500'
                        : 'text-gray-300'
                      }`}>
                        {row.overall_average > 0 ? `${row.overall_average}%` : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs font-bold px-2 py-1 rounded-lg ${
                        row.grade === 'A' ? 'bg-green-100 text-green-700'
                        : row.grade === 'B' ? 'bg-blue-100 text-blue-700'
                        : row.grade === 'C' ? 'bg-amber-100 text-amber-700'
                        : row.grade === 'D' ? 'bg-orange-100 text-orange-700'
                        : row.grade === 'F' ? 'bg-red-100 text-red-700'
                        : 'text-gray-300'
                      }`}>
                        {row.grade}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {data.data.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              No performance data found for the selected filters.
            </div>
          )}
        </>
      )}

      {!applied && (
        <div className="text-center py-12 text-gray-400">
          <GraduationCap className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p>Select filters and click Generate Report</p>
        </div>
      )}
    </div>
  )
}

function AttendanceReport() {
  const [filters, setFilters] = useState({ class: '', month: '' })
  const [applied, setApplied] = useState(false)

  const { data: classes = [] } = useQuery({
    queryKey: ['classes'],
    queryFn: () => apiClient.get('/classes/').then(r => r.data?.results || r.data || [])
  })

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['attendance-report', filters],
    queryFn: () => apiClient.get('/attendance/report/', { params: filters }).then(r => r.data),
    enabled: applied,
  })

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6">
      <h2 className="font-bold text-[#10026B] text-lg mb-4">Attendance Report</h2>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6 p-4 bg-gray-50 rounded-xl">
        <select
          value={filters.class}
          onChange={e => setFilters(f => ({ ...f, class: e.target.value }))}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm flex-1 min-w-[160px]"
        >
          <option value="">All Classes</option>
          {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        <input
          type="month"
          value={filters.month}
          onChange={e => setFilters(f => ({ ...f, month: e.target.value }))}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm flex-1 min-w-[160px]"
        />

        <button
          onClick={() => { setApplied(true); refetch() }}
          className="bg-[#10026B] text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-[#1a0494] transition-colors"
        >
          Generate Report
        </button>
      </div>

      {isLoading && <div className="text-center py-12 text-gray-400">Generating report...</div>}
      {isError && <div className="text-center py-12 text-red-400">Failed to load. Try again.</div>}

      {data && (
        <>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">
              <span className="font-bold text-[#10026B]">{data.total_students}</span> students
              · Generated {format(parseISO(data.generated_at), 'dd MMM yyyy, HH:mm')}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#10026B]">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-white uppercase">Student</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-white uppercase">Class</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-white uppercase">Present</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-white uppercase">Absent</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-white uppercase">Late</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-white uppercase">%</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-white uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.data.map((row, i) => (
                  <tr key={row.student_id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}>
                    <td className="px-4 py-3 font-medium text-sm text-gray-800">{row.student_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{row.class_name}</td>
                    <td className="px-4 py-3 text-center text-green-600 font-semibold text-sm">{row.present}</td>
                    <td className="px-4 py-3 text-center text-red-500 font-semibold text-sm">{row.absent}</td>
                    <td className="px-4 py-3 text-center text-amber-500 font-semibold text-sm">{row.late}</td>
                    <td className="px-4 py-3 text-center font-bold text-sm text-[#10026B]">{row.percentage}%</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                        row.status === 'Good' ? 'bg-green-100 text-green-700'
                        : row.status === 'Warning' ? 'bg-amber-100 text-amber-700'
                        : 'bg-red-100 text-red-600'
                      }`}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {data.data.length === 0 && (
            <div className="text-center py-12 text-gray-400">No attendance records found.</div>
          )}
        </>
      )}

      {!applied && (
        <div className="text-center py-12 text-gray-400">
          <CalendarCheck className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p>Select filters and click Generate Report</p>
        </div>
      )}
    </div>
  )
}

function EnrollmentReport() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['enrollment-report'],
    queryFn: () => apiClient.get('/enrollment/report/').then(r => r.data),
  })

  if (isLoading) return <div className="text-center py-12 text-gray-400">Loading enrollment report...</div>
  if (isError) return <div className="text-center py-12 text-red-400">Failed to load report.</div>
  if (!data) return null

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-6">
      <h2 className="font-bold text-[#10026B] text-lg">Enrollment Report</h2>

      <p className="text-xs text-gray-400">
        Generated {format(parseISO(data.generated_at), 'dd MMM yyyy, HH:mm')}
      </p>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Total Applications', value: data.summary.total, color: 'bg-[#10026B]' },
          { label: 'Pending', value: data.summary.pending, color: 'bg-amber-500' },
          { label: 'Reviewed', value: data.summary.reviewed, color: 'bg-blue-500' },
          { label: 'Approved', value: data.summary.approved, color: 'bg-green-500' },
          { label: 'Rejected', value: data.summary.rejected, color: 'bg-red-500' },
        ].map(card => (
          <div key={card.label} className="bg-white rounded-xl border border-gray-100 p-4 text-center">
            <div className={`w-10 h-10 ${card.color} rounded-full flex items-center justify-center mx-auto mb-2`}>
              <span className="text-white font-bold text-sm">{card.value}</span>
            </div>
            <p className="text-xs text-gray-500">{card.label}</p>
          </div>
        ))}
      </div>

      {/* By grade */}
      <div>
        <h3 className="font-bold text-[#10026B] text-sm mb-3">Applications by Grade</h3>
        <div className="space-y-2">
          {data.by_grade.map(g => (
            <div key={g.grade_applying} className="flex items-center gap-4">
              <span className="text-sm text-gray-600 w-20">{g.grade_applying}</span>
              <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                <div
                  className="h-full bg-[#10026B] rounded-full transition-all"
                  style={{ width: `${(g.count / data.summary.total) * 100}%` }}
                />
              </div>
              <span className="text-sm font-bold text-[#10026B] w-8">{g.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent enrollments */}
      <div>
        <h3 className="font-bold text-[#10026B] text-sm mb-3">Recent Applications</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#10026B]">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-white uppercase">Admission No.</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-white uppercase">Name</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-white uppercase">Grade</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-white uppercase">Status</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-white uppercase">Payment</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-white uppercase">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.recent_enrollments.map((row, i) => (
                <tr key={row.admission_number} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}>
                  <td className="px-4 py-3 text-sm font-mono text-gray-600">{row.admission_number}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-800">{row.full_name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{row.grade}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                      row.status === 'APPROVED' ? 'bg-green-100 text-green-700'
                      : row.status === 'REVIEWED' ? 'bg-blue-100 text-blue-700'
                      : row.status === 'PENDING' ? 'bg-amber-100 text-amber-700'
                      : 'bg-red-100 text-red-600'
                    }`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                      row.payment_status === 'PAID' ? 'bg-green-100 text-green-700'
                      : row.payment_status === 'PARTIAL' ? 'bg-amber-100 text-amber-700'
                      : 'bg-red-100 text-red-600'
                    }`}>
                      {row.payment_status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400">
                    {format(parseISO(row.created_at), 'dd MMM yyyy')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
