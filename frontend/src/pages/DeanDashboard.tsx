import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../components/ui/Toast';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { SectionLoader, SkeletonLoader, Spinner } from '../components/ui/Loader';
import { apiFetch } from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserCheck,
  UserX,
  Activity,
  Search,
  Filter,
  Trash2,
  Plus,
  Upload,
  Layers,
  Download,
  AlertCircle,
  TrendingUp,
  Clock,
  BookOpen,
  Sun,
  Moon,
  LogOut
} from 'lucide-react';

interface Faculty {
  faculty_id: string;
  employee_id: string;
  name: string;
  department: 'CSA' | 'CSE' | 'AI & ML';
  designation: string;
  skills: string;
  email: string;
}
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';

// React.memo for high-performance chart containers to avoid re-renders
const MemoizedPieChart = React.memo(({ data, colors }: { data: any[]; colors: string[] }) => (
  <ResponsiveContainer width="100%" height="100%">
    <PieChart>
      <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={3} dataKey="value">
        {data.map((_, index) => (
          <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
        ))}
      </Pie>
      <Tooltip />
      <Legend />
    </PieChart>
  </ResponsiveContainer>
));
MemoizedPieChart.displayName = 'MemoizedPieChart';

const MemoizedBarChart = React.memo(({ data, dataKey, xKey, fill }: { data: any[]; dataKey: string; xKey: string; fill: string }) => (
  <ResponsiveContainer width="100%" height="100%">
    <BarChart data={data}>
      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1f1f23" opacity={0.1} />
      <XAxis dataKey={xKey} stroke="#888888" fontSize={11} tickLine={false} />
      <YAxis stroke="#888888" fontSize={11} tickLine={false} />
      <Tooltip cursor={{ fill: 'rgba(37, 99, 235, 0.05)' }} />
      <Bar dataKey={dataKey} fill={fill} radius={[4, 4, 0, 0]} barSize={40} />
    </BarChart>
  </ResponsiveContainer>
));
MemoizedBarChart.displayName = 'MemoizedBarChart';

export const DeanDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { success, error: toastError, warning } = useToast();
  const queryClient = useQueryClient();

  // Root Navigation Tabs
  const [activeTab, setActiveTab] = useState('overview');

  // Sub-tabs for Faculty Management
  const [mgmtTab, setMgmtTab] = useState('list');

  // Parameters
  const [facultySearch, setFacultySearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [facultyPage, setFacultyPage] = useState(1);
  const [facultyLimit] = useState(6);

  // Today Date for availability & dashboard stats
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Real-Time Availability slot filter
  const [selectedAvailabilitySlot, setSelectedAvailabilitySlot] = useState('9:00 – 10:00');
  const [showOnlyFreeFaculty, setShowOnlyFreeFaculty] = useState(false);
  const [availabilityDept, setAvailabilityDept] = useState('All');

  // Workload Analytics Sort
  const [workloadSortBy, setWorkloadSortBy] = useState('totalLoad'); // teachingHours, workHours, attendanceRate, totalLoad
  const [workloadOrder, setWorkloadOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedWorkloadFaculty, setSelectedWorkloadFaculty] = useState('All');

  // Queries
  // 1. Dashboard Stats Card
  const { data: statsData, isLoading: isStatsLoading } = useQuery({
    queryKey: ['dean-dashboard-stats', selectedDate],
    queryFn: () => apiFetch(`/analytics/dean-dashboard?date=${selectedDate}`),
    enabled: !!user
  });

  // 2. Faculty List
  const { data: facultyListData, isLoading: isFacultyListLoading } = useQuery({
    queryKey: ['faculty-list', facultySearch, deptFilter, facultyPage, facultyLimit],
    queryFn: () => apiFetch(`/faculty`, {
      params: {
        search: facultySearch,
        department: deptFilter,
        page: facultyPage,
        limit: facultyLimit
      }
    }),
    enabled: activeTab === 'management' && mgmtTab === 'list'
  });

  // 3. Real-time Availability
  const { data: availabilityData, isLoading: isAvailabilityLoading } = useQuery({
    queryKey: ['faculty-availability', selectedDate, selectedAvailabilitySlot],
    queryFn: () => apiFetch(`/attendance/availability?date=${selectedDate}&slot=${selectedAvailabilitySlot}`),
    enabled: activeTab === 'availability'
  });

  // 4. Workload Analytics
  const { data: workloadData, isLoading: isWorkloadLoading, isFetching: isWorkloadFetching } = useQuery({
    queryKey: ['workload-analytics', workloadSortBy, workloadOrder],
    queryFn: () => apiFetch(`/analytics/workload?sortBy=${workloadSortBy}&order=${workloadOrder}`),
    enabled: activeTab === 'workload'
  });

  // 5. Advanced Analytics Charts
  const { data: advancedData, isLoading: isAdvancedLoading } = useQuery({
    queryKey: ['advanced-analytics'],
    queryFn: () => apiFetch('/analytics/advanced'),
    enabled: activeTab === 'analytics'
  });

  // Mutations
  // Add Faculty
  const [addEmpId, setAddEmpId] = useState('');
  const [addName, setAddName] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addPassword, setAddPassword] = useState('');
  const [addDept, setAddDept] = useState<'CSA' | 'CSE' | 'AI & ML'>('CSE');
  const [addDesignation, setAddDesignation] = useState('Assistant Professor');
  const [addSkills, setAddSkills] = useState('');
  const [isAddingFaculty, setIsAddingFaculty] = useState(false);

  const handleAddFaculty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addEmpId || !addName || !addEmail || !addPassword || !addDept || !addDesignation) {
      toastError('Validation Error', 'Please fill in all required fields.');
      return;
    }
    setIsAddingFaculty(true);
    try {
      await apiFetch('/faculty', {
        method: 'POST',
        body: JSON.stringify({
          employee_id: addEmpId,
          name: addName,
          email: addEmail,
          password: addPassword,
          department: addDept,
          designation: addDesignation,
          skills: addSkills
        })
      });
      success('Faculty Created', `Account for ${addName} has been successfully initialized.`);
      // Reset
      setAddEmpId('');
      setAddName('');
      setAddEmail('');
      setAddPassword('');
      setAddSkills('');
      // Switch to list
      setMgmtTab('list');
      queryClient.invalidateQueries({ queryKey: ['faculty-list'] });
    } catch (err: any) {
      toastError('Creation Failed', err.message || 'Unable to create faculty.');
    } finally {
      setIsAddingFaculty(false);
    }
  };

  // Delete Faculty Account
  const deleteFacultyMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/faculty/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faculty-list'] });
      queryClient.invalidateQueries({ queryKey: ['dean-dashboard-stats'] });
      success('Faculty Deleted', 'Account and attendance records deleted.');
    },
    onError: (err: any) => {
      toastError('Delete Failed', err.message || 'Unable to delete account.');
    }
  });

  const handleDeleteFaculty = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to permanently delete Dr./Prof. ${name}? This will remove all associated user credentials and attendance records.`)) {
      deleteFacultyMutation.mutate(id);
    }
  };

  // CSV Bulk Upload
  const [bulkCsvFile, setBulkCsvFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<any[]>([]);
  const [isUploadingBulk, setIsUploadingBulk] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBulkCsvFile(file);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').map(line => line.split(','));
      
      // Parse header & body
      const headers = lines[0].map(h => h.trim().toLowerCase());
      const previewRows = lines.slice(1, 6).filter(line => line.length > 1).map(line => {
        const obj: any = {};
        line.forEach((val, idx) => {
          const headerName = headers[idx];
          if (headerName) {
            obj[headerName] = val.trim().replace(/^["']|["']$/g, '');
          }
        });
        return obj;
      });
      setCsvPreview(previewRows);
    };
    reader.readAsText(file);
  };

  const handleBulkUpload = async () => {
    if (!bulkCsvFile) {
      toastError('Upload Error', 'Please select a CSV file first.');
      return;
    }

    setIsUploadingBulk(true);
    try {
      const fileReader = new FileReader();
      fileReader.onload = async (e) => {
        const text = e.target?.result as string;
        const lines = text.split('\n');
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        
        const facultyList = lines.slice(1).filter(line => line.trim().length > 0).map(line => {
          // simple csv parser handling quotes
          const values: string[] = [];
          let currentVal = '';
          let inQuotes = false;
          
          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"' || char === "'") {
              inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
              values.push(currentVal.trim());
              currentVal = '';
            } else {
              currentVal += char;
            }
          }
          values.push(currentVal.trim());

          const obj: any = {};
          values.forEach((val, idx) => {
            const header = headers[idx];
            if (header) {
              obj[header] = val.replace(/^["']|["']$/g, '');
            }
          });
          return obj;
        });

        // POST JSON to backend
        const res = await apiFetch('/faculty/bulk-upload', {
          method: 'POST',
          body: JSON.stringify({ facultyList })
        });

        if (res.errors.length > 0) {
          warning('Completed with errors', `${res.successCount} accounts created. ${res.errors.length} failed. Check alerts.`);
          // Log errors to console or show in UI
          console.error('Bulk upload errors:', res.errors);
        } else {
          success('Bulk Upload Complete', `${res.successCount} faculty accounts created successfully.`);
        }

        // Reset
        setBulkCsvFile(null);
        setCsvPreview([]);
        setMgmtTab('list');
        queryClient.invalidateQueries({ queryKey: ['faculty-list'] });
        queryClient.invalidateQueries({ queryKey: ['dean-dashboard-stats'] });
      };
      fileReader.readAsText(bulkCsvFile);
    } catch (err: any) {
      toastError('Upload Failed', err.message || 'Unable to parse CSV file.');
    } finally {
      setIsUploadingBulk(false);
    }
  };

  // Semester Mapping
  const [selectedMapSemester, setSelectedMapSemester] = useState('Spring 2026');
  const [newSemesterInput, setNewSemesterInput] = useState('');
  const [isCreatingSemester, setIsCreatingSemester] = useState(false);

  const handleCreateSemester = async () => {
    if (!newSemesterInput.trim()) return;
    setIsCreatingSemester(true);
    try {
      await apiFetch('/faculty/semesters', {
        method: 'POST',
        body: JSON.stringify({ semester_name: newSemesterInput.trim() })
      });
      success('Semester Added', `"${newSemesterInput}" has been added to semesters.`);
      setSelectedMapSemester(newSemesterInput.trim());
      setNewSemesterInput('');
      queryClient.invalidateQueries({ queryKey: ['semesters-list'] });
    } catch (err: any) {
      toastError('Add Semester Failed', err.message || 'Error creating semester.');
    } finally {
      setIsCreatingSemester(false);
    }
  };

  // Group Availability List
  const availabilityGroups = useMemo(() => {
    if (!availabilityData?.facultyAvailability) return { teaching: [], available: [], office: [], research: [] };

    let list = availabilityData.facultyAvailability as any[];

    // Apply department filter
    if (availabilityDept && availabilityDept !== 'All') {
      list = list.filter(f => f.department === availabilityDept);
    }

    const teaching = list.filter(f => f.activity === 'Teaching');
    const available = list.filter(f => f.activity === 'Free');
    const office = list.filter(f => f.activity === 'Office Work');
    const research = list.filter(f => f.activity === 'Research');

    return { teaching, available, office, research };
  }, [availabilityData, availabilityDept]);

  // Workload Filters & Sorting
  const filteredWorkload = useMemo(() => {
    if (!workloadData) return [];
    let list = workloadData as any[];
    if (selectedWorkloadFaculty && selectedWorkloadFaculty !== 'All') {
      list = list.filter(f => f.faculty_id === selectedWorkloadFaculty);
    }
    return list;
  }, [workloadData, selectedWorkloadFaculty]);

  // Export Reports Handler
  const [exportingReportType, setExportingReportType] = useState<string | null>(null);

  const handleExport = async (reportName: string, format: 'csv' | 'excel' | 'pdf') => {
    setExportingReportType(`${reportName}-${format}`);
    try {
      // Fetch full datasets based on reportName
      let data: any[] = [];
      let headers: string[] = [];
      let filename = `${reportName.toLowerCase().replace(/\s+/g, '_')}_report_${new Date().toISOString().split('T')[0]}`;

      if (reportName === 'Attendance') {
        const raw = await apiFetch(`/attendance/availability?date=${selectedDate}`);
        data = raw.facultyAvailability.map((f: any) => ({
          'Employee ID': f.employee_id,
          'Name': f.name,
          'Department': f.department,
          'Designation': f.designation,
          'Today Status': f.activity,
          'Remarks': f.remarks || 'None'
        }));
        headers = ['Employee ID', 'Name', 'Department', 'Designation', 'Today Status', 'Remarks'];
      } else if (reportName === 'Faculty Workload') {
        const raw = await apiFetch('/analytics/workload');
        data = raw.map((f: any) => ({
          'Employee ID': f.employee_id,
          'Name': f.name,
          'Department': f.department,
          'Designation': f.designation,
          'Teaching Hours (30d)': f.teachingHours,
          'Desk Work Hours (30d)': f.workHours,
          'Free Hours (30d)': f.freeHours,
          'Total Hours (30d)': f.totalLoad,
          'Attendance Rate (%)': f.attendanceRate
        }));
        headers = ['Employee ID', 'Name', 'Department', 'Designation', 'Teaching Hours (30d)', 'Desk Work Hours (30d)', 'Free Hours (30d)', 'Total Hours (30d)', 'Attendance Rate (%)'];
      } else if (reportName === 'Department') {
        const raw = await apiFetch('/analytics/advanced');
        data = raw.attendanceByDept.map((d: any) => {
          const load = raw.facultyWorkload.find((l: any) => l.department === d.department);
          return {
            'Department': d.department,
            'Attendance Rate (%)': d.rate,
            'Avg Teaching Hours (30d)': load?.Teaching || 0,
            'Avg Office Work (30d)': load?.['Office Work'] || 0,
            'Avg Research (30d)': load?.Research || 0,
            'Avg Meetings (30d)': load?.Meeting || 0
          };
        });
        headers = ['Department', 'Attendance Rate (%)', 'Avg Teaching Hours (30d)', 'Avg Office Work (30d)', 'Avg Research (30d)', 'Avg Meetings (30d)'];
      } else if (reportName === 'Semester') {
        const raw = await apiFetch('/faculty');
        data = raw.faculty.map((f: any) => ({
          'Employee ID': f.employee_id,
          'Name': f.name,
          'Department': f.department,
          'Designation': f.designation,
          'Active Semester': selectedMapSemester
        }));
        headers = ['Employee ID', 'Name', 'Department', 'Designation', 'Active Semester'];
      }

      if (format === 'csv' || format === 'excel') {
        // Generate CSV string
        const csvContent = [
          headers.join(','),
          ...data.map(row => 
            headers.map(h => {
              const val = row[h];
              return typeof val === 'string' && val.includes(',') ? `"${val}"` : val;
            }).join(',')
          )
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `${filename}.${format === 'excel' ? 'xls' : 'csv'}`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        success('Report Downloaded', `${reportName} report saved in ${format.toUpperCase()} format.`);
      } else if (format === 'pdf') {
        // Renders a high-fidelity print layouts
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          const tableRows = data.map(row => 
            `<tr>${headers.map(h => `<td style="padding: 8px; border-bottom: 1px solid #e4e4e7; font-size: 11px;">${row[h]}</td>`).join('')}</tr>`
          ).join('');

          printWindow.document.write(`
            <html>
              <head>
                <title>${reportName} Report</title>
                <style>
                  body { font-family: 'Inter', sans-serif; padding: 40px; color: #09090b; }
                  h1 { font-family: 'Outfit', sans-serif; font-size: 24px; margin-bottom: 5px; }
                  p { font-size: 12px; color: #71717a; margin-bottom: 20px; }
                  table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                  th { text-align: left; padding: 10px 8px; border-bottom: 2px solid #09090b; font-size: 11px; text-transform: uppercase; color: #71717a; }
                  .header-row { display: flex; justify-content: space-between; align-items: baseline; border-bottom: 1px solid #e4e4e7; padding-bottom: 15px; margin-bottom: 20px; }
                </style>
              </head>
              <body>
                <div class="header-row">
                  <div>
                    <h1>Aegis Faculty Management System</h1>
                    <p>${reportName} Report • Semester: ${selectedMapSemester}</p>
                  </div>
                  <div style="font-size: 11px; font-family: monospace;">Generated: ${new Date().toLocaleString()}</div>
                </div>
                <table>
                  <thead>
                    <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
                  </thead>
                  <tbody>
                    ${tableRows}
                  </tbody>
                </table>
                <script>
                  window.onload = function() { window.print(); window.close(); }
                </script>
              </body>
            </html>
          `);
          printWindow.document.close();
          success('PDF Print Dialog Opened', 'Report print layout loaded.');
        }
      }
    } catch (err: any) {
      toastError('Export Failed', err.message || 'Unable to generate report data.');
    } finally {
      setExportingReportType(null);
    }
  };

  // Color Palette Constants for Charts
  const CHART_COLORS = ["#2563eb", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4"];

  // Segmented Slot Selector Options
  const slotsList = [
    '9:00 – 10:00',
    '10:00 – 11:00',
    '11:00 – 12:00',
    '12:00 – 1:00',
    '1:00 – 2:00',
    '2:00 – 3:00',
    '3:00 – 4:00',
    '4:00 – 5:00'
  ];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#09090b] flex flex-col transition-colors">
      {/* Dean Top Header */}
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0c0c0f] py-4 px-6 sticky top-0 z-30 transition-colors">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-extrabold text-sm shadow-md shadow-blue-500/10">
              D
            </div>
            <div>
              <h1 className="text-sm font-semibold tracking-tight text-zinc-950 dark:text-zinc-50 font-display">
                Dean Dashboard Console
              </h1>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">
                Administrative Control Panel • Active Term: Spring 2026
              </p>
            </div>
          </div>

          {/* Header Actions */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 cursor-pointer transition-colors"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-zinc-600" />}
            </button>
            {/* Logout */}
            <button
              onClick={logout}
              className="flex items-center gap-2 p-2 px-3 border border-rose-200 dark:border-rose-950 bg-rose-50/20 dark:bg-rose-950/10 text-rose-600 dark:text-rose-400 hover:bg-rose-100/40 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto p-6 flex flex-col gap-6">
        
        {/* KPI Summaries Row */}
        {isStatsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <SkeletonLoader variant="card" />
            <SkeletonLoader variant="card" />
            <SkeletonLoader variant="card" />
            <SkeletonLoader variant="card" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="hover:border-zinc-300 dark:hover:border-zinc-700/80 transition-all">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <span className="text-xs text-zinc-400 font-medium uppercase tracking-wider block">Present Today</span>
                  <span className="text-3xl font-extrabold font-display tracking-tight text-zinc-900 dark:text-zinc-100 mt-1 block">
                    {statsData?.cards?.presentToday || 0}
                  </span>
                  <span className="text-[10px] text-emerald-500 font-semibold mt-1 flex items-center gap-0.5">
                    <UserCheck className="w-3 h-3" /> Active on campus
                  </span>
                </div>
                <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <UserCheck className="w-5 h-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="hover:border-zinc-300 dark:hover:border-zinc-700/80 transition-all">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <span className="text-xs text-zinc-400 font-medium uppercase tracking-wider block">Absent Today</span>
                  <span className="text-3xl font-extrabold font-display tracking-tight text-zinc-900 dark:text-zinc-100 mt-1 block">
                    {statsData?.cards?.absentToday || 0}
                  </span>
                  <span className="text-[10px] text-rose-500 font-semibold mt-1 flex items-center gap-0.5">
                    <UserX className="w-3 h-3" /> On casual/sick leave
                  </span>
                </div>
                <div className="w-10 h-10 rounded-lg bg-rose-50 dark:bg-rose-950/20 flex items-center justify-center text-rose-600 dark:text-rose-400">
                  <UserX className="w-5 h-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="hover:border-zinc-300 dark:hover:border-zinc-700/80 transition-all">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <span className="text-xs text-zinc-400 font-medium uppercase tracking-wider block">Unmarked Faculty</span>
                  <span className="text-3xl font-extrabold font-display tracking-tight text-zinc-900 dark:text-zinc-100 mt-1 block">
                    {statsData?.cards?.unmarkedFaculty || 0}
                  </span>
                  <span className="text-[10px] text-amber-500 font-semibold mt-1 flex items-center gap-0.5">
                    <Clock className="w-3 h-3" /> Awaiting logs
                  </span>
                </div>
                <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-950/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
                  <Clock className="w-5 h-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="hover:border-zinc-300 dark:hover:border-zinc-700/80 transition-all">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <span className="text-xs text-zinc-400 font-medium uppercase tracking-wider block">Attendance Health %</span>
                  <span className="text-3xl font-extrabold font-display tracking-tight text-zinc-900 dark:text-zinc-100 mt-1 block">
                    {statsData?.cards?.attendanceHealth || 0}%
                  </span>
                  <span className="text-[10px] text-blue-500 font-semibold mt-1 flex items-center gap-0.5">
                    <TrendingUp className="w-3 h-3" /> Average target: &gt;90%
                  </span>
                </div>
                <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <Activity className="w-5 h-5" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Quick Insights Alerts & Root Tabs Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Quick Insights and Alerts Bar */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>System Insights & Alerts</CardTitle>
              <CardDescription>Live highlights for active Semester</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isStatsLoading ? (
                <div className="space-y-3">
                  <SkeletonLoader />
                  <SkeletonLoader />
                  <SkeletonLoader />
                </div>
              ) : (
                <>
                  <div className="flex flex-col gap-2 bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800/80 rounded-lg p-3">
                    <span className="text-[10px] uppercase font-semibold text-zinc-400">Current Semester</span>
                    <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 font-display">
                      {statsData?.insights?.currentSemester || 'Spring 2026'}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800/80 rounded-lg p-3">
                      <span className="text-[10px] uppercase font-semibold text-zinc-400">Most Active</span>
                      <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 mt-1 truncate">
                        {statsData?.insights?.mostActive?.name || 'N/A'}
                      </span>
                      <span className="text-[9px] text-blue-500 font-medium mt-0.5">
                        {statsData?.insights?.mostActive?.hours || 0} work hrs
                      </span>
                    </div>
                    <div className="flex flex-col bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800/80 rounded-lg p-3">
                      <span className="text-[10px] uppercase font-semibold text-zinc-400">Least Active</span>
                      <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 mt-1 truncate">
                        {statsData?.insights?.leastActive?.name || 'N/A'}
                      </span>
                      <span className="text-[9px] text-zinc-400 font-medium mt-0.5">
                        {statsData?.insights?.leastActive?.hours || 0} work hrs
                      </span>
                    </div>
                  </div>

                  {/* Action Required Notices */}
                  <div className="space-y-2">
                    <span className="text-[10px] uppercase font-semibold text-zinc-400">Action Required</span>
                    <div className="max-h-[140px] overflow-y-auto space-y-2 pr-1">
                      {statsData?.insights?.alerts?.length > 0 ? (
                        statsData.insights.alerts.map((alert: string, i: number) => (
                          <div key={i} className="flex gap-2 p-2 rounded-lg bg-rose-50/20 dark:bg-rose-950/10 border border-rose-100/50 dark:border-rose-950/20 text-[11px] text-rose-800 dark:text-rose-400">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-500" />
                            <span>{alert}</span>
                          </div>
                        ))
                      ) : (
                        <div className="text-[11px] text-zinc-400 py-4 text-center">
                          All systems normal. No critical alerts.
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Module navigation tabs panel */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Primary Tab Headers */}
            <div className="flex flex-wrap items-center justify-between border-b border-zinc-200 dark:border-zinc-800/80 gap-3">
              <div className="flex space-x-6">
                {[
                  { id: 'overview', label: 'Console Home' },
                  { id: 'management', label: 'Faculty Manager' },
                  { id: 'availability', label: 'Availability View' },
                  { id: 'workload', label: 'Workload Analytics' },
                  { id: 'analytics', label: 'Advanced Stats' },
                  { id: 'reports', label: 'Reports & Export' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-3 px-1 border-b-2 font-medium text-sm transition-all duration-200 cursor-pointer ${
                      activeTab === tab.id
                        ? 'border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-400 font-semibold'
                        : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              
              {/* Live Date display */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Date:</span>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={e => setSelectedDate(e.target.value)}
                  className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-lg px-2 py-1 text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none"
                />
              </div>
            </div>

            {/* Content Modules Rendered here */}
            <div className="flex-1">
              <AnimatePresence mode="wait">
                
                {/* 1. Overview Console Home */}
                {activeTab === 'overview' && (
                  <motion.div
                    key="overview"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="space-y-6"
                  >
                    <div className="flex flex-col gap-2">
                      <h2 className="text-xl font-bold font-display text-zinc-950 dark:text-zinc-50 tracking-tight">Welcome, Administrator</h2>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        Access scheduling audits, real-time availability filters, and workload optimization charts using the tab controls above.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card className="hover:shadow-md transition-all">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Layers className="w-5 h-5 text-blue-500" />
                            <span>Faculty Control Desk</span>
                          </CardTitle>
                          <CardDescription>Register single accounts or import CSV lists in bulk.</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <Button onClick={() => { setActiveTab('management'); setMgmtTab('add'); }} className="w-full">
                            Add New Faculty
                          </Button>
                        </CardContent>
                      </Card>

                      <Card className="hover:shadow-md transition-all">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Activity className="w-5 h-5 text-indigo-500" />
                            <span>Availability Tracking</span>
                          </CardTitle>
                          <CardDescription>Track teaching schedules and Cabin Hour free statuses in real-time.</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <Button onClick={() => setActiveTab('availability')} variant="secondary" className="w-full">
                            Open Availability Grid
                          </Button>
                        </CardContent>
                      </Card>
                    </div>
                  </motion.div>
                )}

                {/* 2. Faculty Management Tab */}
                {activeTab === 'management' && (
                  <motion.div
                    key="management"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="space-y-6"
                  >
                    {/* Management Sub-Tabs */}
                    <div className="border-b border-zinc-200 dark:border-zinc-800/80 mb-4">
                      <nav className="flex space-x-6 -mb-px">
                        {[
                          { id: 'list', label: 'Faculty List' },
                          { id: 'add', label: 'Add Faculty' },
                          { id: 'bulk', label: 'Bulk CSV Upload' },
                          { id: 'mapping', label: 'Semester Mapping' }
                        ].map(sub => (
                          <button
                            key={sub.id}
                            onClick={() => setMgmtTab(sub.id)}
                            className={`py-2 px-1 border-b-2 font-medium text-xs tracking-wide transition-all cursor-pointer ${
                              mgmtTab === sub.id
                                ? 'border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-400 font-semibold'
                                : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'
                            }`}
                          >
                            {sub.label}
                          </button>
                        ))}
                      </nav>
                    </div>

                    {/* SUB-TAB: Faculty List */}
                    {mgmtTab === 'list' && (
                      <div className="space-y-4">
                        {/* Filters Toolbar */}
                        <div className="flex flex-col sm:flex-row gap-3">
                          <div className="relative flex-1">
                            <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
                            <input
                              type="text"
                              placeholder="Search by name, designation, or email..."
                              value={facultySearch}
                              onChange={e => { setFacultySearch(e.target.value); setFacultyPage(1); }}
                              className="w-full bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-lg pl-10 pr-4 py-2 text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-sm"
                            />
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Filter className="w-3.5 h-3.5 text-zinc-400" />
                            <Select
                              ref={undefined}
                              options={[
                                { value: 'All', label: 'All Departments' },
                                { value: 'CSA', label: 'CSA (BCA, MCA)' },
                                { value: 'CSE', label: 'CSE (B.Tech, M.Tech)' },
                                { value: 'AI & ML', label: 'AI & ML (B.Tech)' }
                              ]}
                              value={deptFilter}
                              onChange={e => { setDeptFilter(e.target.value); setFacultyPage(1); }}
                              className="text-xs py-1.5 min-w-[150px]"
                            />
                          </div>
                        </div>

                        {/* List Table container */}
                        {isFacultyListLoading ? (
                          <SkeletonLoader variant="table" />
                        ) : (
                          <div className="border border-zinc-200 dark:border-zinc-800/80 rounded-xl overflow-hidden bg-white dark:bg-[#0c0c0f] shadow-sm">
                            <table className="w-full text-left border-collapse">
                              <thead>
                                <tr className="bg-zinc-50 dark:bg-zinc-900/60 border-b border-zinc-100 dark:border-zinc-800/80 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 select-none">
                                  <th className="p-4 pl-5">Emp ID</th>
                                  <th className="p-4">Name</th>
                                  <th className="p-4">Department</th>
                                  <th className="p-4">Designation</th>
                                  <th className="p-4">Skills</th>
                                  <th className="p-4 pr-5 text-right">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80 text-xs text-zinc-700 dark:text-zinc-200">
                                {facultyListData?.faculty?.length > 0 ? (
                                  facultyListData.faculty.map((fac: Faculty) => (
                                    <tr key={fac.faculty_id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10 transition-colors">
                                      <td className="p-4 pl-5 font-mono text-[11px] text-zinc-400 font-semibold">{fac.employee_id}</td>
                                      <td className="p-4">
                                        <div className="font-semibold text-zinc-900 dark:text-zinc-100">{fac.name}</div>
                                        <div className="text-[10px] text-zinc-400 font-normal">{fac.email}</div>
                                      </td>
                                      <td className="p-4">
                                        <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400">
                                          {fac.department}
                                        </span>
                                      </td>
                                      <td className="p-4 font-medium text-zinc-500 dark:text-zinc-400">{fac.designation}</td>
                                      <td className="p-4 max-w-[200px] truncate font-normal text-zinc-400" title={fac.skills}>
                                        {fac.skills || 'None'}
                                      </td>
                                      <td className="p-4 pr-5 text-right">
                                        <button
                                          onClick={() => handleDeleteFaculty(fac.faculty_id, fac.name)}
                                          className="p-1.5 text-zinc-400 hover:text-rose-500 hover:bg-rose-50/50 dark:hover:bg-rose-950/20 rounded-lg cursor-pointer transition-colors"
                                          title="Delete Faculty"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      </td>
                                    </tr>
                                  ))
                                ) : (
                                  <tr>
                                    <td colSpan={6} className="p-8 text-center text-zinc-400 font-medium">
                                      No faculty members found matching filters.
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>

                            {/* Pagination Controls */}
                            {facultyListData?.pagination && (
                              <div className="bg-zinc-50 dark:bg-zinc-900/30 p-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-500 font-medium">
                                <span>
                                  Page {facultyListData.pagination.page} of {facultyListData.pagination.totalPages || 1} ({facultyListData.pagination.total} total)
                                </span>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    disabled={facultyListData.pagination.page === 1}
                                    onClick={() => setFacultyPage(prev => Math.max(1, prev - 1))}
                                    className="py-1 px-2.5 text-[10px]"
                                  >
                                    Previous
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    disabled={facultyListData.pagination.page >= facultyListData.pagination.totalPages}
                                    onClick={() => setFacultyPage(prev => prev + 1)}
                                    className="py-1 px-2.5 text-[10px]"
                                  >
                                    Next
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* SUB-TAB: Add Faculty Form */}
                    {mgmtTab === 'add' && (
                      <Card className="max-w-xl mx-auto">
                        <CardHeader>
                          <CardTitle>Initialize Faculty Account</CardTitle>
                          <CardDescription>Create a new login profile and ERP entry</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <form onSubmit={handleAddFaculty} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <Input
                                label="Employee ID"
                                placeholder="e.g. EMP102"
                                value={addEmpId}
                                onChange={e => setAddEmpId(e.target.value)}
                                required
                              />
                              <Select
                                label="Consolidated Department"
                                options={[
                                  { value: 'CSE', label: 'CSE (B.Tech / M.Tech / DS)' },
                                  { value: 'CSA', label: 'CSA (BCA / MCA)' },
                                  { value: 'AI & ML', label: 'AI & ML (B.Tech / Cyber)' }
                                ]}
                                value={addDept}
                                onChange={e => setAddDept(e.target.value as any)}
                              />
                            </div>

                            <Input
                              label="Full Name"
                              placeholder="Dr. Jane Smith"
                              value={addName}
                              onChange={e => setAddName(e.target.value)}
                              required
                            />

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <Input
                                label="Campus Email Address"
                                type="email"
                                placeholder="jane.smith@college.edu"
                                value={addEmail}
                                onChange={e => setAddEmail(e.target.value)}
                                required
                              />
                              <Input
                                label="Temporary Password"
                                type="password"
                                placeholder="••••••••"
                                value={addPassword}
                                onChange={e => setAddPassword(e.target.value)}
                                required
                              />
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                              <Input
                                label="Designation"
                                placeholder="e.g. Associate Professor"
                                value={addDesignation}
                                onChange={e => setAddDesignation(e.target.value)}
                                required
                              />
                              <Input
                                label="Skills / Key Subject Competencies (Comma Separated)"
                                placeholder="React, PyTorch, SQL, Networking"
                                value={addSkills}
                                onChange={e => setAddSkills(e.target.value)}
                              />
                            </div>

                            <Button type="submit" isLoading={isAddingFaculty} className="w-full mt-2">
                              <Plus className="w-4 h-4 mr-2" />
                              Create Faculty Account
                            </Button>
                          </form>
                        </CardContent>
                      </Card>
                    )}

                    {/* SUB-TAB: Bulk CSV Upload */}
                    {mgmtTab === 'bulk' && (
                      <div className="max-w-xl mx-auto space-y-6">
                        <Card>
                          <CardHeader>
                            <CardTitle>Bulk Import Faculty via CSV</CardTitle>
                            <CardDescription>
                              Upload a CSV sheet of faculty members to instantly initialize credentials and profiles.
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            {/* CSV template instructions */}
                            <div className="text-xs text-zinc-500 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl leading-relaxed">
                              <span className="font-semibold text-zinc-700 dark:text-zinc-300">Required CSV Columns:</span>
                              <code className="block bg-zinc-100 dark:bg-zinc-950 p-2 rounded mt-2 text-[10px] font-mono">
                                employee_id, name, email, department, designation, skills
                              </code>
                              <span className="block mt-2">
                                Note: Department column must contain BCA/MCA (which normalizes to **CSA**), B.Tech CSE/M.Tech CSE/DS (resolves to **CSE**), or AI/ML/Cyber (resolves to **AI & ML**). Default account passwords will be set to <code className="bg-zinc-100 dark:bg-zinc-950 px-1 rounded font-mono">password123</code>.
                              </span>
                            </div>

                            {/* Upload Area */}
                            <div className="border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl p-8 flex flex-col items-center justify-center gap-3 hover:border-blue-500/50 dark:hover:border-blue-500/30 transition-colors bg-white dark:bg-[#0c0c0f] relative">
                              <input
                                type="file"
                                accept=".csv"
                                onChange={handleFileChange}
                                className="absolute inset-0 opacity-0 cursor-pointer"
                              />
                              <Upload className="w-8 h-8 text-zinc-400" />
                              <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                                {bulkCsvFile ? bulkCsvFile.name : 'Click or Drag CSV here'}
                              </span>
                              <span className="text-[10px] text-zinc-400">Max size: 5MB</span>
                            </div>

                            {/* Preview Grid */}
                            {csvPreview.length > 0 && (
                              <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                                <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Preview (First 5 Rows):</span>
                                <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-x-auto">
                                  <table className="w-full text-left text-[10px] font-normal border-collapse">
                                    <thead>
                                      <tr className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 text-zinc-500 font-semibold uppercase">
                                        <th className="p-2">Emp ID</th>
                                        <th className="p-2">Name</th>
                                        <th className="p-2">Email</th>
                                        <th className="p-2">Dept</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 text-zinc-600 dark:text-zinc-300 font-medium">
                                      {csvPreview.map((row, i) => (
                                        <tr key={i}>
                                          <td className="p-2 font-mono">{row.employee_id || 'N/A'}</td>
                                          <td className="p-2">{row.name || 'N/A'}</td>
                                          <td className="p-2">{row.email || 'N/A'}</td>
                                          <td className="p-2">{row.department || 'N/A'}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}

                            <Button
                              onClick={handleBulkUpload}
                              isLoading={isUploadingBulk}
                              disabled={!bulkCsvFile}
                              className="w-full"
                            >
                              <Upload className="w-4 h-4 mr-2" />
                              Upload and Register Accounts
                            </Button>
                          </CardContent>
                        </Card>
                      </div>
                    )}

                    {/* SUB-TAB: Semester Mapping */}
                    {mgmtTab === 'mapping' && (
                      <div className="max-w-xl mx-auto space-y-6">
                        <Card>
                          <CardHeader>
                            <CardTitle>Configure Active Semester Mapping</CardTitle>
                            <CardDescription>
                              Establish the active academic term for tracking department workloads and attendance.
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="flex flex-col gap-3 bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800/80 rounded-xl p-4">
                              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Current Mapping</span>
                              <div className="flex items-center gap-2">
                                <Layers className="w-5 h-5 text-blue-600 dark:text-blue-500" />
                                <span className="text-base font-bold font-display text-zinc-800 dark:text-zinc-100">
                                  {selectedMapSemester}
                                </span>
                              </div>
                            </div>

                            {/* Create Semester Input */}
                            <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 space-y-3">
                              <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Initialize New Semester Term</label>
                              <div className="flex gap-2">
                                <Input
                                  placeholder="e.g. Fall 2026, Summer 22"
                                  value={newSemesterInput}
                                  onChange={e => setNewSemesterInput(e.target.value)}
                                  containerClassName="flex-1"
                                />
                                <Button
                                  onClick={handleCreateSemester}
                                  isLoading={isCreatingSemester}
                                  className="mt-1"
                                >
                                  Add Term
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* 3. Faculty Availability Tab */}
                {activeTab === 'availability' && (
                  <motion.div
                    key="availability"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="space-y-6"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h2 className="text-xl font-bold font-display text-zinc-950 dark:text-zinc-50 tracking-tight flex items-center gap-2">
                          Real-time Cabin Availability Tracker
                        </h2>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                          Current Slot: <span className="font-semibold text-blue-600 dark:text-blue-400">{availabilityData?.slot}</span> (based on {selectedDate})
                        </p>
                      </div>

                      {/* Dropdown Filters */}
                      <div className="flex flex-wrap gap-2 items-center">
                        <Select
                          ref={undefined}
                          options={[
                            { value: 'All', label: 'All Departments' },
                            { value: 'CSA', label: 'CSA' },
                            { value: 'CSE', label: 'CSE' },
                            { value: 'AI & ML', label: 'AI & ML' }
                          ]}
                          value={availabilityDept}
                          onChange={e => setAvailabilityDept(e.target.value)}
                          className="text-xs py-1.5"
                        />
                        
                        <Select
                          ref={undefined}
                          options={slotsList.map(s => ({ value: s, label: s }))}
                          value={selectedAvailabilitySlot}
                          onChange={e => setSelectedAvailabilitySlot(e.target.value)}
                          className="text-xs py-1.5"
                        />

                        {/* Show Only Free Toggle */}
                        <label className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs bg-white dark:bg-[#0c0c0f] font-medium text-zinc-600 dark:text-zinc-400 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={showOnlyFreeFaculty}
                            onChange={e => setShowOnlyFreeFaculty(e.target.checked)}
                            className="w-4 h-4 rounded text-blue-600 accent-blue-600"
                          />
                          <span>Show Only Free</span>
                        </label>
                      </div>
                    </div>

                    {isAvailabilityLoading ? (
                      <SectionLoader message="Syncing faculty availability states..." />
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        
                        {/* Group: Available Faculty */}
                        <Card className={showOnlyFreeFaculty ? 'md:col-span-2 lg:col-span-4' : ''}>
                          <CardHeader className="bg-emerald-50/50 dark:bg-emerald-950/10 border-b border-emerald-100/50 dark:border-emerald-950/20">
                            <CardTitle className="text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                              Available Faculty ({availabilityGroups.available.length})
                            </CardTitle>
                            <CardDescription>Faculty currently marked Free/Cabin Hours</CardDescription>
                          </CardHeader>
                          <CardContent className="p-4 space-y-3">
                            {availabilityGroups.available.length > 0 ? (
                              availabilityGroups.available.map((f: any) => (
                                <div key={f.faculty_id} className="p-3 bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800/80 rounded-lg hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors flex justify-between items-center gap-3">
                                  <div>
                                    <div className="font-semibold text-xs text-zinc-900 dark:text-zinc-100">{f.name}</div>
                                    <div className="text-[10px] text-zinc-400 font-medium">{f.designation} • {f.department}</div>
                                  </div>
                                  <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded">
                                    Free
                                  </span>
                                </div>
                              ))
                            ) : (
                              <div className="text-xs text-zinc-400 py-6 text-center">No available faculty in this slot.</div>
                            )}
                          </CardContent>
                        </Card>

                        {/* Other Groups hidden if Toggle "Show Only Free" is active */}
                        {!showOnlyFreeFaculty && (
                          <>
                            {/* Group: Teaching Faculty */}
                            <Card>
                              <CardHeader className="bg-blue-50/50 dark:bg-blue-950/10 border-b border-blue-100/50 dark:border-blue-950/20">
                                <CardTitle className="text-blue-700 dark:text-blue-400 flex items-center gap-2">
                                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                                  Teaching ({availabilityGroups.teaching.length})
                                </CardTitle>
                                <CardDescription>Lectures / Lab sessions</CardDescription>
                              </CardHeader>
                              <CardContent className="p-4 space-y-3">
                                {availabilityGroups.teaching.length > 0 ? (
                                  availabilityGroups.teaching.map((f: any) => (
                                    <div key={f.faculty_id} className="p-3 bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800/80 rounded-lg hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors flex flex-col gap-1">
                                      <div className="flex justify-between items-start gap-2">
                                        <div className="font-semibold text-xs text-zinc-900 dark:text-zinc-100 truncate">{f.name}</div>
                                        <span className="text-[9px] font-semibold text-blue-600 bg-blue-50 dark:bg-blue-950/30 px-1.5 py-0.5 rounded shrink-0">Teaching</span>
                                      </div>
                                      <div className="text-[9px] text-zinc-400">{f.designation} • {f.department}</div>
                                      {f.remarks && <div className="text-[9px] text-zinc-400 font-mono italic mt-1 border-t border-zinc-100 dark:border-zinc-800 pt-1 truncate">{f.remarks}</div>}
                                    </div>
                                  ))
                                ) : (
                                  <div className="text-xs text-zinc-400 py-6 text-center">No faculty teaching in this slot.</div>
                                )}
                              </CardContent>
                            </Card>

                            {/* Group: Office Work Faculty */}
                            <Card>
                              <CardHeader className="bg-amber-50/50 dark:bg-amber-950/10 border-b border-amber-100/50 dark:border-amber-950/20">
                                <CardTitle className="text-amber-700 dark:text-amber-400 flex items-center gap-2">
                                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                                  Office Work ({availabilityGroups.office.length})
                                </CardTitle>
                                <CardDescription>Grading & Administration</CardDescription>
                              </CardHeader>
                              <CardContent className="p-4 space-y-3">
                                {availabilityGroups.office.length > 0 ? (
                                  availabilityGroups.office.map((f: any) => (
                                    <div key={f.faculty_id} className="p-3 bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800/80 rounded-lg hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors flex flex-col gap-1">
                                      <div className="flex justify-between items-start gap-2">
                                        <div className="font-semibold text-xs text-zinc-900 dark:text-zinc-100 truncate">{f.name}</div>
                                        <span className="text-[9px] font-semibold text-amber-600 bg-amber-50 dark:bg-amber-950/30 px-1.5 py-0.5 rounded shrink-0">Office</span>
                                      </div>
                                      <div className="text-[9px] text-zinc-400">{f.designation} • {f.department}</div>
                                    </div>
                                  ))
                                ) : (
                                  <div className="text-xs text-zinc-400 py-6 text-center">No office tasks logged.</div>
                                )}
                              </CardContent>
                            </Card>

                            {/* Group: Research Faculty */}
                            <Card>
                              <CardHeader className="bg-purple-50/50 dark:bg-purple-950/10 border-b border-purple-100/50 dark:border-purple-950/20">
                                <CardTitle className="text-purple-700 dark:text-purple-400 flex items-center gap-2">
                                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                                  Research ({availabilityGroups.research.length})
                                </CardTitle>
                                <CardDescription>Research Paper writing / Labs</CardDescription>
                              </CardHeader>
                              <CardContent className="p-4 space-y-3">
                                {availabilityGroups.research.length > 0 ? (
                                  availabilityGroups.research.map((f: any) => (
                                    <div key={f.faculty_id} className="p-3 bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800/80 rounded-lg hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors flex flex-col gap-1">
                                      <div className="flex justify-between items-start gap-2">
                                        <div className="font-semibold text-xs text-zinc-900 dark:text-zinc-100 truncate">{f.name}</div>
                                        <span className="text-[9px] font-semibold text-purple-600 bg-purple-50 dark:bg-purple-950/30 px-1.5 py-0.5 rounded shrink-0">Research</span>
                                      </div>
                                      <div className="text-[9px] text-zinc-400">{f.designation} • {f.department}</div>
                                    </div>
                                  ))
                                ) : (
                                  <div className="text-xs text-zinc-400 py-6 text-center">No research work logged.</div>
                                )}
                              </CardContent>
                            </Card>
                          </>
                        )}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* 4. Workload Analytics Tab */}
                {activeTab === 'workload' && (
                  <motion.div
                    key="workload"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="space-y-6"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h2 className="text-xl font-bold font-display text-zinc-950 dark:text-zinc-50 tracking-tight">
                          Faculty Workload Analytics
                        </h2>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                          Compare teaching hours and operational desk duties across department staff.
                        </p>
                      </div>

                      {/* Sorting & Order Controls */}
                      <div className="flex flex-wrap gap-2 items-center">
                        <Select
                          ref={undefined}
                          label="Sort by"
                          options={[
                            { value: 'totalLoad', label: 'Total Load (30d)' },
                            { value: 'teachingHours', label: 'Teaching Hours' },
                            { value: 'workHours', label: 'Desk Work Hours' },
                            { value: 'attendanceRate', label: 'Attendance Health %' }
                          ]}
                          value={workloadSortBy}
                          onChange={e => setWorkloadSortBy(e.target.value)}
                          className="text-xs py-1 min-w-[150px]"
                          containerClassName="w-auto"
                        />

                        <Select
                          ref={undefined}
                          label="Order"
                          options={[
                            { value: 'desc', label: 'Descending' },
                            { value: 'asc', label: 'Ascending' }
                          ]}
                          value={workloadOrder}
                          onChange={e => setWorkloadOrder(e.target.value as any)}
                          className="text-xs py-1"
                          containerClassName="w-auto"
                        />

                        {/* Filter Specific Faculty dropdown */}
                        <Select
                          ref={undefined}
                          label="Filter Faculty"
                          options={[
                            { value: 'All', label: 'All Faculty' },
                            ...(workloadData ? workloadData.map((f: any) => ({ value: f.faculty_id, label: f.name })) : [])
                          ]}
                          value={selectedWorkloadFaculty}
                          onChange={e => setSelectedWorkloadFaculty(e.target.value)}
                          className="text-xs py-1"
                          containerClassName="w-auto"
                        />
                      </div>
                    </div>

                    {isWorkloadLoading ? (
                      <SkeletonLoader variant="table" />
                    ) : (
                      <div className="grid grid-cols-1 gap-6 relative">
                        
                        {/* CHART CONTAINER WITH BACKGROUND LOADING OVERLAY
                            Does not unmount or reload page. Keeps graph visible, shows overlay, updates smoothly. */}
                        <Card className="relative overflow-hidden">
                          {/* Background Fetching Loader Overlay */}
                          {isWorkloadFetching && (
                            <div className="absolute inset-0 bg-white/60 dark:bg-[#0c0c0f]/60 backdrop-blur-[0.5px] z-20 flex items-center justify-center rounded-xl transition-all duration-300">
                              <div className="flex items-center gap-2 bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 p-3 rounded-lg shadow-md">
                                <Spinner className="w-4 h-4 text-blue-600" />
                                <span className="text-xs text-zinc-500 font-semibold tracking-wide">Syncing data in background...</span>
                              </div>
                            </div>
                          )}

                          <CardHeader>
                            <CardTitle>Workload Load Distribution (30 Days)</CardTitle>
                            <CardDescription>Teaching Hours vs. Desk Operations Work (Office, Research, Meeting)</CardDescription>
                          </CardHeader>
                          <CardContent className="h-[380px]">
                            {filteredWorkload.length > 0 ? (
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={filteredWorkload} margin={{ top: 20, right: 10, bottom: 20, left: -10 }}>
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#1f1f23' : '#f0f0f0'} />
                                  <XAxis dataKey="name" stroke={theme === 'dark' ? '#71717a' : '#888888'} fontSize={10} tickLine={false} />
                                  <YAxis stroke={theme === 'dark' ? '#71717a' : '#888888'} fontSize={10} tickLine={false} />
                                  <Tooltip
                                    contentStyle={{
                                      backgroundColor: theme === 'dark' ? '#0c0c0f' : '#ffffff',
                                      borderColor: theme === 'dark' ? '#1e1e24' : '#e4e4e7',
                                      color: theme === 'dark' ? '#ffffff' : '#000000'
                                    }}
                                  />
                                  <Legend />
                                  <Bar dataKey="teachingHours" name="Teaching Hours" fill="#2563eb" stackId="a" radius={[0, 0, 0, 0]} />
                                  <Bar dataKey="workHours" name="Desk Work Hours" fill="#10b981" stackId="a" radius={[4, 4, 0, 0]} />
                                </BarChart>
                              </ResponsiveContainer>
                            ) : (
                              <div className="h-full flex items-center justify-center text-sm text-zinc-400">No chart data loaded</div>
                            )}
                          </CardContent>
                        </Card>

                        {/* List Breakdown of workloads */}
                        <div className="border border-zinc-200 dark:border-zinc-800/80 rounded-xl overflow-hidden bg-white dark:bg-[#0c0c0f] shadow-sm">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-zinc-50 dark:bg-zinc-900/60 border-b border-zinc-100 dark:border-zinc-800/80 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                                <th className="p-3 pl-4">Name</th>
                                <th className="p-3">Department</th>
                                <th className="p-3 text-center">Teaching Hours</th>
                                <th className="p-3 text-center">Desk Work Hours</th>
                                <th className="p-3 text-center font-bold">Total Workload</th>
                                <th className="p-3 text-right pr-4">Attendance Rate</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80 text-xs text-zinc-700 dark:text-zinc-200">
                              {filteredWorkload.map((f: any) => (
                                <tr key={f.faculty_id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10 transition-colors">
                                  <td className="p-3 pl-4">
                                    <div className="font-semibold text-zinc-900 dark:text-zinc-100">{f.name}</div>
                                    <div className="text-[10px] text-zinc-400 font-mono font-normal">{f.employee_id} • {f.designation}</div>
                                  </td>
                                  <td className="p-3">
                                    <span className="inline-flex px-2 py-0.5 rounded-full text-[9px] font-semibold bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400">
                                      {f.department}
                                    </span>
                                  </td>
                                  <td className="p-3 text-center font-mono font-medium">{f.teachingHours} hrs</td>
                                  <td className="p-3 text-center font-mono font-medium">{f.workHours} hrs</td>
                                  <td className="p-3 text-center font-mono font-bold text-blue-600 dark:text-blue-400">{f.totalLoad} hrs</td>
                                  <td className="p-3 text-right pr-4">
                                    <div className="flex items-center justify-end gap-2">
                                      <span className="font-semibold font-mono">{f.attendanceRate}%</span>
                                      {/* Micro progress bar indicator */}
                                      <div className="w-12 h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden shrink-0">
                                        <div
                                          className={`h-full rounded-full ${f.attendanceRate > 90 ? 'bg-emerald-500' : (f.attendanceRate > 80 ? 'bg-amber-400' : 'bg-rose-500')}`}
                                          style={{ width: `${f.attendanceRate}%` }}
                                        />
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* 5. Advanced Analytics Charts */}
                {activeTab === 'analytics' && (
                  <motion.div
                    key="analytics"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="space-y-6"
                  >
                    <div>
                      <h2 className="text-xl font-bold font-display text-zinc-950 dark:text-zinc-50 tracking-tight">
                        Advanced Institution Analytics
                      </h2>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                        High-fidelity audit charts across attendance, workloads, and department compare metrics (30 Days).
                      </p>
                    </div>

                    {isAdvancedLoading ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <SkeletonLoader variant="card" className="h-[300px]" />
                        <SkeletonLoader variant="card" className="h-[300px]" />
                        <SkeletonLoader variant="card" className="h-[300px]" />
                        <SkeletonLoader variant="card" className="h-[300px]" />
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        
                        {/* 1. Attendance Distribution Donut Chart */}
                        <Card>
                          <CardHeader>
                            <CardTitle>Attendance Distribution</CardTitle>
                            <CardDescription>Ratio of marked present, leaves, and free slots logged</CardDescription>
                          </CardHeader>
                          <CardContent className="h-[250px]">
                            {advancedData?.attendanceDistribution ? (
                              <MemoizedPieChart data={advancedData.attendanceDistribution} colors={CHART_COLORS} />
                            ) : (
                              <div className="h-full flex items-center justify-center text-xs text-zinc-400">Loading chart...</div>
                            )}
                          </CardContent>
                        </Card>

                        {/* 2. Attendance By Department Bar Chart */}
                        <Card>
                          <CardHeader>
                            <CardTitle>Attendance Health By Department</CardTitle>
                            <CardDescription>Departmental average attendance compliance (%)</CardDescription>
                          </CardHeader>
                          <CardContent className="h-[250px]">
                            {advancedData?.attendanceByDept ? (
                              <MemoizedBarChart data={advancedData.attendanceByDept} dataKey="rate" xKey="department" fill="#2563eb" />
                            ) : (
                              <div className="h-full flex items-center justify-center text-xs text-zinc-400">Loading chart...</div>
                            )}
                          </CardContent>
                        </Card>

                        {/* 3. Stacked Workload Bar Chart */}
                        <Card>
                          <CardHeader>
                            <CardTitle>Faculty Workload Breakdown By Department</CardTitle>
                            <CardDescription>Average activity hours allocated per faculty</CardDescription>
                          </CardHeader>
                          <CardContent className="h-[250px]">
                            {advancedData?.facultyWorkload ? (
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={advancedData.facultyWorkload}>
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1f1f23" opacity={0.1} />
                                  <XAxis dataKey="department" stroke="#888888" fontSize={11} tickLine={false} />
                                  <YAxis stroke="#888888" fontSize={11} tickLine={false} />
                                  <Tooltip />
                                  <Legend />
                                  <Bar dataKey="Teaching" stackId="a" fill="#2563eb" />
                                  <Bar dataKey="Office Work" stackId="a" fill="#10b981" />
                                  <Bar dataKey="Research" stackId="a" fill="#8b5cf6" />
                                  <Bar dataKey="Meeting" stackId="a" fill="#f59e0b" />
                                </BarChart>
                              </ResponsiveContainer>
                            ) : (
                              <div className="h-full flex items-center justify-center text-xs text-zinc-400">Loading chart...</div>
                            )}
                          </CardContent>
                        </Card>

                        {/* 4. Monthly Attendance Trend Line Chart */}
                        <Card>
                          <CardHeader>
                            <CardTitle>Attendance compliance trend</CardTitle>
                            <CardDescription>Daily check-in percentages over past 30 days</CardDescription>
                          </CardHeader>
                          <CardContent className="h-[250px]">
                            {advancedData?.monthlyAttendanceTrend ? (
                              <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={advancedData.monthlyAttendanceTrend} margin={{ right: 20, left: -20 }}>
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1f1f23" opacity={0.1} />
                                  <XAxis dataKey="date" stroke="#888888" fontSize={10} tickLine={false} />
                                  <YAxis stroke="#888888" fontSize={10} tickLine={false} domain={[50, 100]} />
                                  <Tooltip />
                                  <Line type="monotone" dataKey="Attendance Rate" stroke="#2563eb" strokeWidth={2.5} dot={false} />
                                </LineChart>
                              </ResponsiveContainer>
                            ) : (
                              <div className="h-full flex items-center justify-center text-xs text-zinc-400">Loading chart...</div>
                            )}
                          </CardContent>
                        </Card>

                        {/* 5. Department Comparison Area Chart */}
                        <Card>
                          <CardHeader>
                            <CardTitle>Department Average Workload comparison</CardTitle>
                            <CardDescription>Comparison of average active work hours logged</CardDescription>
                          </CardHeader>
                          <CardContent className="h-[250px]">
                            {advancedData?.departmentComparison ? (
                              <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={advancedData.departmentComparison} margin={{ right: 20, left: -20 }}>
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1f1f23" opacity={0.1} />
                                  <XAxis dataKey="department" stroke="#888888" fontSize={11} tickLine={false} />
                                  <YAxis stroke="#888888" fontSize={11} tickLine={false} />
                                  <Tooltip />
                                  <Area type="monotone" dataKey="Average Workload (Hours)" stroke="#8b5cf6" fill="rgba(139, 92, 246, 0.15)" strokeWidth={2} />
                                  <Area type="monotone" dataKey="Utility Rate (%)" stroke="#10b981" fill="rgba(16, 185, 129, 0.1)" strokeWidth={2} />
                                </AreaChart>
                              </ResponsiveContainer>
                            ) : (
                              <div className="h-full flex items-center justify-center text-xs text-zinc-400">Loading chart...</div>
                            )}
                          </CardContent>
                        </Card>

                        {/* 6. Faculty Distribution Pie Chart */}
                        <Card>
                          <CardHeader>
                            <CardTitle>Faculty Distribution By Department</CardTitle>
                            <CardDescription>Share of total faculty count by department</CardDescription>
                          </CardHeader>
                          <CardContent className="h-[250px]">
                            {advancedData?.facultyDistribution ? (
                              <MemoizedPieChart data={advancedData.facultyDistribution} colors={CHART_COLORS} />
                            ) : (
                              <div className="h-full flex items-center justify-center text-xs text-zinc-400">Loading chart...</div>
                            )}
                          </CardContent>
                        </Card>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* 6. Reports & Export Tab */}
                {activeTab === 'reports' && (
                  <motion.div
                    key="reports"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="space-y-6"
                  >
                    <div>
                      <h2 className="text-xl font-bold font-display text-zinc-950 dark:text-zinc-50 tracking-tight">
                        Institution Audit Reports
                      </h2>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                        Download compliance sheets, semester mappings, and workload audits in PDF, CSV, or XLS format.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      {[
                        { name: 'Attendance', desc: 'Detailed log of daily faculty check-ins, leaves, and activity statuses.' },
                        { name: 'Faculty Workload', desc: 'Summary of teaching hours, administrative office tasks, and individual logs.' },
                        { name: 'Department', desc: 'Consolidated report comparing workloads and compliance metrics by department.' },
                        { name: 'Semester', desc: 'List of faculty mapping assignments and designations for the current term.' }
                      ].map(rep => (
                        <Card key={rep.name} className="hover:border-zinc-300 dark:hover:border-zinc-700/80 transition-colors">
                          <CardHeader>
                            <CardTitle>{rep.name} Report</CardTitle>
                            <CardDescription>{rep.desc}</CardDescription>
                          </CardHeader>
                          <CardContent className="flex flex-wrap gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleExport(rep.name, 'csv')}
                              disabled={!!exportingReportType}
                              isLoading={exportingReportType === `${rep.name}-csv`}
                            >
                              <Download className="w-3.5 h-3.5 mr-1.5" />
                              CSV
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleExport(rep.name, 'excel')}
                              disabled={!!exportingReportType}
                              isLoading={exportingReportType === `${rep.name}-excel`}
                            >
                              <Download className="w-3.5 h-3.5 mr-1.5" />
                              Excel
                            </Button>
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleExport(rep.name, 'pdf')}
                              disabled={!!exportingReportType}
                              isLoading={exportingReportType === `${rep.name}-pdf`}
                            >
                              <BookOpen className="w-3.5 h-3.5 mr-1.5" />
                              Print PDF
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
