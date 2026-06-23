import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../components/ui/Toast';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { SkeletonLoader } from '../components/ui/Loader';
import { apiFetch } from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  BarChart3,
  User,
  LogOut,
  Sun,
  Moon,
  Save,
  CheckCircle,
  Clock,
  Key,
  Mail
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';

export const FacultyDashboard: React.FC = () => {
  const { user, logout, updateFacultyProfile } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { success, error: toastError } = useToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState('schedule');
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Today's Schedule Query
  const { data: scheduleData, isLoading: isScheduleLoading } = useQuery({
    queryKey: ['today-schedule', selectedDate],
    queryFn: () => apiFetch(`/attendance/today-schedule?date=${selectedDate}`),
    enabled: !!user
  });

  // Personal Analytics Query
  const { data: analyticsData, isLoading: isAnalyticsLoading } = useQuery({
    queryKey: ['faculty-analytics'],
    queryFn: () => apiFetch(`/analytics/faculty`),
    enabled: activeTab === 'analytics'
  });

  // Local state for schedule (to allow user editing before submit)
  const [localSlots, setLocalSlots] = useState<{ slot: string; activity: string; remarks: string }[]>([]);

  useEffect(() => {
    if (scheduleData?.slots) {
      setLocalSlots(scheduleData.slots);
    }
  }, [scheduleData]);

  // Submit Schedule Mutation
  const submitScheduleMutation = useMutation({
    mutationFn: (payload: { date: string; slots: typeof localSlots }) =>
      apiFetch('/attendance/submit-schedule', {
        method: 'POST',
        body: JSON.stringify(payload)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['today-schedule', selectedDate] });
      success('Schedule Saved', 'Today\'s activity schedule has been successfully submitted.');
    },
    onError: (err: any) => {
      toastError('Save Failed', err.message || 'Unable to save schedule.');
    }
  });

  const handleActivityChange = (index: number, value: string) => {
    setLocalSlots(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], activity: value };
      return copy;
    });
  };

  const handleRemarksChange = (index: number, value: string) => {
    setLocalSlots(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], remarks: value };
      return copy;
    });
  };

  const handleSaveSchedule = () => {
    submitScheduleMutation.mutate({
      date: selectedDate,
      slots: localSlots
    });
  };

  // Profile Edit State
  const [profileName, setProfileName] = useState(user?.faculty?.name || '');
  const [profileDesignation, setProfileDesignation] = useState(user?.faculty?.designation || '');
  const [profileSkills, setProfileSkills] = useState(user?.faculty?.skills || '');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Password Edit State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    try {
      const res = await apiFetch('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify({
          name: profileName,
          designation: profileDesignation,
          skills: profileSkills,
          department: user?.faculty?.department // Keep department as is
        })
      });
      updateFacultyProfile(res.faculty);
      success('Profile Updated', 'Your profile details have been saved successfully.');
    } catch (err: any) {
      toastError('Update Failed', err.message || 'Unable to update profile.');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      toastError('Validation Error', 'Both current and new passwords are required.');
      return;
    }
    if (newPassword.length < 6) {
      toastError('Validation Error', 'New password must be at least 6 characters.');
      return;
    }
    setIsUpdatingPassword(true);
    try {
      await apiFetch('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword })
      });
      success('Password Updated', 'Your account password has been changed.');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err: any) {
      toastError('Change Failed', err.message || 'Unable to change password.');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // Options for Activity Select dropdowns
  const activityOptions = [
    { value: 'Teaching', label: 'Teaching' },
    { value: 'Office Work', label: 'Office Work' },
    { value: 'Research', label: 'Research' },
    { value: 'Meeting', label: 'Meeting' },
    { value: 'Free', label: 'Free' },
    { value: 'Other', label: 'Other' }
  ];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#09090b] flex flex-col transition-colors">
      {/* Top Navigation Header */}
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0c0c0f] py-4 px-6 sticky top-0 z-30 transition-colors">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">
          {/* Logo & Welcome */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-extrabold text-sm shadow-md shadow-blue-500/10">
              F
            </div>
            <div>
              <h1 className="text-sm font-semibold tracking-tight text-zinc-950 dark:text-zinc-50 font-display">
                {user?.faculty?.name || user?.email}
              </h1>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">
                {user?.faculty?.designation} • {user?.faculty?.department} Department
              </p>
            </div>
          </div>

          {/* Action buttons */}
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

      {/* Main Container */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto p-6 flex flex-col gap-6">
        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex space-x-6">
            <button
              onClick={() => setActiveTab('schedule')}
              className={`flex items-center gap-2 py-3 px-1 border-b-2 font-medium text-sm transition-all duration-200 cursor-pointer ${
                activeTab === 'schedule'
                  ? 'border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-400 font-semibold'
                  : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Today's Schedule</span>
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-2 py-3 px-1 border-b-2 font-medium text-sm transition-all duration-200 cursor-pointer ${
                activeTab === 'analytics'
                  ? 'border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-400 font-semibold'
                  : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Personal Analytics</span>
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-2 py-3 px-1 border-b-2 font-medium text-sm transition-all duration-200 cursor-pointer ${
                activeTab === 'profile'
                  ? 'border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-400 font-semibold'
                  : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Manage Profile</span>
            </button>
          </div>
          <span className="text-xs font-mono text-zinc-400 bg-zinc-100 dark:bg-zinc-900 rounded-md px-2 py-1 select-none">
            Emp ID: {user?.faculty?.employee_id}
          </span>
        </div>

        {/* Tab Contents */}
        <AnimatePresence mode="wait">
          {activeTab === 'schedule' && (
            <motion.div
              key="schedule"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* Header Widget Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold font-display text-zinc-950 dark:text-zinc-50 tracking-tight">
                    Schedule Tracker
                  </h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    Select a date and allocate your daily slots to log attendance.
                  </p>
                </div>
                {/* Date Picker Input */}
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Select Date:</span>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={e => setSelectedDate(e.target.value)}
                    className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-lg px-3.5 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer shadow-sm"
                  />
                </div>
              </div>

              {isScheduleLoading ? (
                <SkeletonLoader variant="table" />
              ) : (
                <Card>
                  <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <CardTitle>Schedule for {selectedDate}</CardTitle>
                      <CardDescription>
                        State indicators: {scheduleData?.isSubmitted ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                            <CheckCircle className="w-3.5 h-3.5" /> Attendance Submitted
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold">
                            <Clock className="w-3.5 h-3.5" /> Unmarked / Draft
                          </span>
                        )}
                      </CardDescription>
                    </div>
                    <Button
                      onClick={handleSaveSchedule}
                      isLoading={submitScheduleMutation.isPending}
                      className="shrink-0"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Submit Attendance
                    </Button>
                  </CardHeader>
                  <CardContent className="divide-y divide-zinc-100 dark:divide-zinc-800/80 p-0">
                    {localSlots.map((slotItem, index) => (
                      <div
                        key={slotItem.slot}
                        className="flex flex-col lg:flex-row items-stretch lg:items-center p-4 lg:p-5 gap-4 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10 transition-colors"
                      >
                        {/* Time label */}
                        <div className="lg:w-1/5 flex items-center gap-2">
                          <Clock className="w-4 h-4 text-zinc-400" />
                          <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 font-display">
                            {slotItem.slot}
                          </span>
                        </div>

                        {/* Dropdown Activity */}
                        <div className="lg:w-1/4">
                          <Select
                            ref={undefined}
                            options={activityOptions}
                            value={slotItem.activity}
                            onChange={e => handleActivityChange(index, e.target.value)}
                            className="text-xs py-1.5"
                          />
                        </div>

                        {/* Remarks Input */}
                        <div className="flex-1">
                          <input
                            type="text"
                            placeholder="Add slot remarks (e.g. Topic, Classroom, Meeting Agenda)"
                            value={slotItem.remarks}
                            onChange={e => handleRemarksChange(index, e.target.value)}
                            className="w-full bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all placeholder-zinc-400"
                          />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </motion.div>
          )}

          {activeTab === 'analytics' && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-xl font-bold font-display text-zinc-950 dark:text-zinc-50 tracking-tight">
                  Personal Workload Insights
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  Track your teaching, desk operations, and attendance performance.
                </p>
              </div>

              {isAnalyticsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <SkeletonLoader variant="card" />
                  <SkeletonLoader variant="card" />
                  <SkeletonLoader variant="card" />
                </div>
              ) : (
                <>
                  {/* Stats Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-xs uppercase tracking-wider text-zinc-400">This Week</CardTitle>
                        <CardDescription>Past 7 days overview</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex justify-between items-baseline">
                            <span className="text-3xl font-extrabold text-blue-600 font-display">
                              {analyticsData?.thisWeek?.presentDays || 0}
                            </span>
                            <span className="text-xs text-zinc-400">Present Days</span>
                          </div>
                          <div className="border-t border-zinc-100 dark:border-zinc-800/80 pt-3 grid grid-cols-3 text-center gap-1">
                            <div>
                              <div className="text-sm font-bold text-zinc-800 dark:text-zinc-200 font-mono">
                                {analyticsData?.thisWeek?.teachingHours || 0}
                              </div>
                              <div className="text-[10px] text-zinc-400">Teaching</div>
                            </div>
                            <div>
                              <div className="text-sm font-bold text-zinc-800 dark:text-zinc-200 font-mono">
                                {analyticsData?.thisWeek?.workHours || 0}
                              </div>
                              <div className="text-[10px] text-zinc-400">Desk Work</div>
                            </div>
                            <div>
                              <div className="text-sm font-bold text-zinc-800 dark:text-zinc-200 font-mono">
                                {analyticsData?.thisWeek?.freeHours || 0}
                              </div>
                              <div className="text-[10px] text-zinc-400">Free</div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-xs uppercase tracking-wider text-zinc-400">Last 30 Days</CardTitle>
                        <CardDescription>Monthly workload snapshot</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex justify-between items-baseline">
                            <span className="text-3xl font-extrabold text-blue-600 font-display">
                              {analyticsData?.last30Days?.presentDays || 0}
                            </span>
                            <span className="text-xs text-zinc-400">Present Days</span>
                          </div>
                          <div className="border-t border-zinc-100 dark:border-zinc-800/80 pt-3 grid grid-cols-3 text-center gap-1">
                            <div>
                              <div className="text-sm font-bold text-zinc-800 dark:text-zinc-200 font-mono">
                                {analyticsData?.last30Days?.teachingHours || 0}
                              </div>
                              <div className="text-[10px] text-zinc-400">Teaching</div>
                            </div>
                            <div>
                              <div className="text-sm font-bold text-zinc-800 dark:text-zinc-200 font-mono">
                                {analyticsData?.last30Days?.workHours || 0}
                              </div>
                              <div className="text-[10px] text-zinc-400">Desk Work</div>
                            </div>
                            <div>
                              <div className="text-sm font-bold text-zinc-800 dark:text-zinc-200 font-mono">
                                {analyticsData?.last30Days?.freeHours || 0}
                              </div>
                              <div className="text-[10px] text-zinc-400">Free</div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-xs uppercase tracking-wider text-zinc-400">Semester</CardTitle>
                        <CardDescription>Active term load aggregator</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex justify-between items-baseline">
                            <span className="text-3xl font-extrabold text-blue-600 font-display">
                              {analyticsData?.semester?.presentDays || 0}
                            </span>
                            <span className="text-xs text-zinc-400">Present Days</span>
                          </div>
                          <div className="border-t border-zinc-100 dark:border-zinc-800/80 pt-3 grid grid-cols-3 text-center gap-1">
                            <div>
                              <div className="text-sm font-bold text-zinc-800 dark:text-zinc-200 font-mono">
                                {analyticsData?.semester?.teachingHours || 0}
                              </div>
                              <div className="text-[10px] text-zinc-400">Teaching</div>
                            </div>
                            <div>
                              <div className="text-sm font-bold text-zinc-800 dark:text-zinc-200 font-mono">
                                {analyticsData?.semester?.workHours || 0}
                              </div>
                              <div className="text-[10px] text-zinc-400">Desk Work</div>
                            </div>
                            <div>
                              <div className="text-sm font-bold text-zinc-800 dark:text-zinc-200 font-mono">
                                {analyticsData?.semester?.freeHours || 0}
                              </div>
                              <div className="text-[10px] text-zinc-400">Free</div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Visual Chart */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Workload Allocation Mix</CardTitle>
                      <CardDescription>Comparison of teaching vs. organizational activity allocations (Hours)</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[350px]">
                      {analyticsData ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <ComposedChart
                            data={[
                              { name: 'This Week', Teaching: analyticsData.thisWeek.teachingHours, 'Desk Work': analyticsData.thisWeek.workHours, Free: analyticsData.thisWeek.freeHours },
                              { name: 'Last 30 Days', Teaching: analyticsData.last30Days.teachingHours, 'Desk Work': analyticsData.last30Days.workHours, Free: analyticsData.last30Days.freeHours },
                              { name: 'Semester', Teaching: analyticsData.semester.teachingHours, 'Desk Work': analyticsData.semester.workHours, Free: analyticsData.semester.freeHours }
                            ]}
                            margin={{ top: 20, right: 20, bottom: 20, left: 0 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#1f1f23' : '#f0f0f0'} />
                            <XAxis dataKey="name" stroke={theme === 'dark' ? '#71717a' : '#888888'} fontSize={12} />
                            <YAxis stroke={theme === 'dark' ? '#71717a' : '#888888'} fontSize={12} />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: theme === 'dark' ? '#0c0c0f' : '#ffffff',
                                borderColor: theme === 'dark' ? '#1e1e24' : '#e4e4e7',
                                color: theme === 'dark' ? '#ffffff' : '#000000'
                              }}
                            />
                            <Legend />
                            <Bar dataKey="Teaching" barSize={30} fill="#2563eb" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="Desk Work" barSize={30} fill="#10b981" radius={[4, 4, 0, 0]} />
                            <Line type="monotone" dataKey="Free" stroke="#f59e0b" strokeWidth={2} />
                          </ComposedChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex items-center justify-center text-sm text-zinc-400">No chart data loaded</div>
                      )}
                    </CardContent>
                  </Card>
                </>
              )}
            </motion.div>
          )}

          {activeTab === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            >
              {/* Profile Details Edit Form */}
              <Card>
                <CardHeader>
                  <CardTitle>Profile Details</CardTitle>
                  <CardDescription>Manage and update your professional faculty profile</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleUpdateProfile} className="space-y-4">
                    {/* Readonly Credentials */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] uppercase tracking-wider font-semibold text-zinc-400">Employee ID</label>
                        <div className="text-sm font-mono mt-1 text-zinc-900 dark:text-zinc-100 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 rounded-lg p-2 selection:bg-blue-500/20">
                          {user?.faculty?.employee_id}
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] uppercase tracking-wider font-semibold text-zinc-400">Department</label>
                        <div className="text-sm mt-1 text-zinc-900 dark:text-zinc-100 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 rounded-lg p-2 selection:bg-blue-500/20">
                          {user?.faculty?.department}
                        </div>
                      </div>
                    </div>

                    <div>
                      <Input
                        ref={undefined}
                        label="Full Name"
                        value={profileName}
                        onChange={e => setProfileName(e.target.value)}
                        required
                      />
                    </div>

                    <div>
                      <Input
                        ref={undefined}
                        label="Designation"
                        value={profileDesignation}
                        onChange={e => setProfileDesignation(e.target.value)}
                        placeholder="e.g. Professor, Assistant Professor"
                        required
                      />
                    </div>

                    <div>
                      <Input
                        ref={undefined}
                        label="Skills (Comma Separated)"
                        value={profileSkills}
                        onChange={e => setProfileSkills(e.target.value)}
                        placeholder="e.g. React, Python, Artificial Intelligence"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wider">Email Address</label>
                      <div className="relative flex items-center">
                        <Mail className="absolute left-3 w-4 h-4 text-zinc-400" />
                        <div className="w-full text-sm mt-1 text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/50 rounded-lg p-2.5 pl-10 cursor-not-allowed select-none">
                          {user?.faculty?.email}
                        </div>
                      </div>
                    </div>

                    <Button type="submit" isLoading={isUpdatingProfile} className="w-full">
                      <Save className="w-4 h-4 mr-2" />
                      Save Profile Changes
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Password change form */}
              <Card>
                <CardHeader>
                  <CardTitle>Change Password</CardTitle>
                  <CardDescription>Update your campus ERP authentication password</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleChangePassword} className="space-y-4">
                    <div>
                      <Input
                        ref={undefined}
                        label="Current Password"
                        type="password"
                        placeholder="••••••••"
                        value={currentPassword}
                        onChange={e => setCurrentPassword(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Input
                        ref={undefined}
                        label="New Password"
                        type="password"
                        placeholder="••••••••"
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        required
                      />
                    </div>
                    <Button type="submit" variant="destructive" isLoading={isUpdatingPassword} className="w-full">
                      <Key className="w-4 h-4 mr-2" />
                      Update Account Password
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};
