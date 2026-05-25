import React, { useState, useEffect } from 'react';
import {
  CheckCircle2, XCircle, Clock, Filter,
  Search, Calendar, User, MessageSquare,
  AlertCircle, Check, X, Camera, Plus, Trash2, Pencil
} from 'lucide-react';
import { LeaveRequest, UserRole } from '../types';
import * as leaveService from '../services/leaveService';
import { useAuth } from '../hooks/useAuth';
import { cn, formatDate, calculateLeaveDays } from '../lib/utils';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';

export default function Leaves() {
  const { user } = useAuth();
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [filter, setFilter] = useState<'All' | 'Pending' | 'Approved' | 'Rejected' | 'Unapproved' | 'Untaken leaves'>('All');
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form state
  const [leaveType, setLeaveType] = useState<LeaveType>('Annual');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('11:00');
  const [reason, setReason] = useState('');
  const [leaveImage, setLeaveImage] = useState<string | null>(null);
  const [showQuotaWarning, setShowQuotaWarning] = useState(false);
  const [pendingSubmitData, setPendingSubmitData] = useState<any>(null);
  const [editingLeaveId, setEditingLeaveId] = useState<string | null>(null);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const isManagement = user.role === 'hr' || user.role === 'owner' || user.role === 'super';

      // Auto-reject expired requests before loading
      if (isManagement) {
        await leaveService.rejectExpiredLeaves();
      }

      const data = await leaveService.getLeaves(isManagement ? undefined : user.uid);
      setLeaves(data || []);
    } catch (err) {
      console.error('Error loading leaves:', err);
      toast.error('Failed to sync leaves');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.uid, user?.role]);

  const handleSubmitLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Consolidated Quota validation (14 days total)
    const totalQuota = user.leaveQuotas?.annual || 14;
    const totalUsed = (Object.values(user.usedLeaves || {}) as number[]).reduce((a: number, b: number) => a + (Number(b) || 0), 0);
    const remaining = (Number(user.leaveQuotas?.annual) || 14) - totalUsed;

    const start = new Date(startDate);
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 2);

    if (start > maxDate) {
      toast.error(`You can only apply for leaves up to 2 months in advance (Before ${maxDate.toLocaleDateString()}).`);
      return;
    }

    const diffDays = calculateLeaveDays(leaveType, startDate, endDate, startTime, endTime);

    if (diffDays > remaining && !editingLeaveId) {
      toast.error(`Insufficient leave balance. Remaining: ${remaining} days.`);
      return;
    }

    setSubmitting(true);

    let isQuotaExceeded = false;
    const [startYear, startMonth] = startDate.split('-').map(Number);
    const monthlyTotal = await leaveService.getMonthlyLeaveTotal(user.uid, startMonth - 1, startYear);
    if (monthlyTotal + diffDays > 1.5) {
      setPendingSubmitData({ diffDays, leaveType, reason, startDate, endDate, startTime, endTime, editingLeaveId, isQuotaExceeded: true });
      setShowQuotaWarning(true);
      setSubmitting(false);
      return;
    }

    await proceedSubmit({ diffDays, leaveType, reason, startDate, endDate, startTime, endTime, editingLeaveId, isQuotaExceeded: false });
  };

  const proceedSubmit = async (data: any) => {
    setSubmitting(true);
    try {
      const leaveData: any = {
        userId: user!.uid,
        userName: user!.name,
        userRole: user!.role,
        leaveType: data.leaveType,
        reason: data.reason,
        startDate: data.startDate,
        endDate: data.leaveType === 'Short' ? data.startDate : data.endDate,
        startTime: data.leaveType === 'Short' ? data.startTime : null,
        endTime: data.leaveType === 'Short' ? data.endTime : null,
        status: 'Pending',
        isQuotaExceeded: data.isQuotaExceeded,
        createdAt: new Date().toISOString(),
      };
      if (leaveImage) leaveData.imageUrl = leaveImage;

      if (data.editingLeaveId) {
        leaveData.id = data.editingLeaveId;
        await leaveService.submitLeave(leaveData);
        toast.success('Leave request updated successfully!');
      } else {
        await leaveService.submitLeave(leaveData);
        toast.success('Leave request submitted successfully!');
      }

      setIsModalOpen(false);
      setEditingLeaveId(null);
      setReason('');
      setStartDate('');
      setEndDate('');
      setStartTime('09:00');
      setEndTime('11:00');
      setLeaveImage(null);
      loadData();
    } catch (error: any) {
      console.error('Submission error:', error);
      toast.error(error.message || 'Failed to submit leave. Check your permissions.');
    } finally {
      setSubmitting(false);
      setShowQuotaWarning(false);
      setPendingSubmitData(null);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setLeaveImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleAction = async (req: LeaveRequest, status: 'Approved' | 'Rejected') => {
    if (!user || !req.id) return;
    try {
      if (status === 'Approved') {
        const start = new Date(req.startDate);
        const monthlyTotal = await leaveService.getMonthlyLeaveTotal(req.userId, start.getMonth(), start.getFullYear());
        const reqDays = calculateLeaveDays(req.leaveType, req.startDate, req.endDate, req.startTime, req.endTime);

        if (monthlyTotal + reqDays > 1.5) {
          const confirmed = window.confirm(`Employee ${req.userName} has applied leave exceeding the monthly limit on ${formatDate(req.startDate)}. Do you confirm approval of this leave request?`);
          if (!confirmed) return;
        }
        await leaveService.approveLeaveRequest(req, user.uid);
      } else {
        await leaveService.updateLeaveStatus(req.id, status, user.uid);
      }
      toast.success(`Leave request ${status.toLowerCase()}`);
      loadData();
    } catch (err: any) {
      console.error('Update error:', err);
      toast.error(err.message || 'Failed to update request');
    }
  };

  const handleEdit = (req: LeaveRequest) => {
    setEditingLeaveId(req.id!);
    setLeaveType(req.leaveType);
    setStartDate(req.startDate);
    setEndDate(req.endDate);
    setStartTime(req.startTime || '09:00');
    setEndTime(req.endTime || '11:00');
    setReason(req.reason);
    setLeaveImage(req.imageUrl || null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this request?')) return;
    try {
      await leaveService.deleteLeave(id);
      toast.success('Request deleted');
      loadData();
    } catch (err) {
      toast.error('Failed to delete request');
    }
  };

  const handleCancelApproved = async (req: LeaveRequest) => {
    if (!window.confirm('Are you sure you want to cancel this approved leave? The quota will be refunded.')) return;
    try {
      await leaveService.cancelApprovedLeave(req, user!.uid);
      toast.success('Approved leave cancelled successfully');
      loadData();
    } catch (err: any) {
      toast.error('Failed to cancel leave');
    }
  };

  const filteredLeaves = leaves.filter(l => {
    let matchesFilter = filter === 'All' || l.status === filter;

    // Handle "Unapproved" virtual status
    if (filter === 'Unapproved') {
      matchesFilter = l.status === 'Rejected' && !l.approvedBy;
    } else if (filter === 'Rejected') {
      matchesFilter = l.status === 'Rejected' && !!l.approvedBy;
    } else if (filter === 'Untaken leaves') {
      matchesFilter = l.status === 'Cancelled';
    }

    const matchesSearch = (l.userName || '').toLowerCase().includes(search.toLowerCase()) ||
      (l.leaveType || '').toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const canApprove = (req: LeaveRequest) => {
    if (!user) return false;
    const myRole = user.role;
    const theirRole = req.userRole;

    // Management (Owner, HR, Super) can approve Employees
    if ((myRole === 'owner' || myRole === 'hr' || myRole === 'super') && theirRole === 'employee') return true;

    // Owners can approve HR and Super as well
    if (myRole === 'owner' && (theirRole === 'hr' || theirRole === 'super')) return true;

    return false;
  };

  const formatBalance = (totalDays: number) => {
    const d = Math.floor(totalDays);
    const h = Number(((totalDays - d) * 8).toFixed(1));
    const parts = [];
    if (d > 0) parts.push(`${d} Day${d !== 1 ? 's' : ''}`);
    if (h > 0) parts.push(`${h} Hour${h !== 1 ? 's' : ''}`);
    return parts.length > 0 ? parts.join(' and ') : '0 Days';
  };

  const totalUsed = (Object.values(user?.usedLeaves || {}) as number[]).reduce((a: number, b: number) => a + (Number(b) || 0), 0);
  const remainingDays = (Number(user?.leaveQuotas?.annual) || 14) + (Number(user?.extraDays) || 0) - totalUsed;

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-zinc-900">Leave Management</h1>
          <p className="text-zinc-500 font-medium tracking-tight">Track, apply, and approve time-off requests</p>
        </div>
        {(user?.role === 'employee' || user?.role === 'hr') && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-orange-500 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-2 hover:bg-orange-600 transition-all shadow-xl shadow-orange-100"
          >
            <Plus size={20} />
            Apply for Leave
          </button>
        )}
      </div>

      {/* 📊 My Balance Summary (Strategic for Employees & HR) */}
      {(user?.role === 'employee' || user?.role === 'hr') && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Total Leave Balance</p>
            <p className="text-2xl font-black text-orange-600">
              {formatBalance(remainingDays)}
              <span className="text-[10px] block opacity-60">Out of {user.leaveQuotas?.annual || 14} total annual days</span>
            </p>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Leaves Taken pool</p>
            <p className="text-2xl font-black text-zinc-900">
              {formatBalance(totalUsed)}
              <span className="text-[10px] block opacity-60">Across all types (Annual, Sick, Casual, Short)</span>
            </p>
          </div>
        </div>
      )}

      {/* Global Stats Summary for Managers */}
      {(user?.role === 'hr' || user?.role === 'owner' || user?.role === 'super') && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: 'Pending', value: leaves.filter(l => l.status === 'Pending').length, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100' },
            { label: 'Total Leaves', value: leaves.length, icon: Calendar, color: 'text-zinc-600', bg: 'bg-zinc-100' },
            { label: 'Approved', value: leaves.filter(l => l.status === 'Approved').length, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-100' },
            { label: 'Rejected', value: leaves.filter(l => l.status === 'Rejected').length, icon: XCircle, color: 'text-red-600', bg: 'bg-red-100' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", stat.bg, stat.color)}>
                  <stat.icon size={18} />
                </div>
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{stat.label}</span>
              </div>
              <p className="text-2xl font-black text-zinc-900">{stat.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-4xl border border-zinc-100 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
          <input
            type="text"
            placeholder="Filter list..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-zinc-50 border border-zinc-100 rounded-2xl text-sm focus:ring-2 focus:ring-zinc-900 outline-none transition-all"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {['All', 'Pending', 'Approved', 'Rejected', 'Unapproved', 'Untaken leaves'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-bold transition-all",
                filter === f
                  ? "bg-zinc-900 text-white"
                  : "bg-zinc-50 text-zinc-500 hover:bg-zinc-100"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Requests List */}
      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {filteredLeaves.map((req) => (
            <motion.div
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              key={req.id}
              className={cn(
                "p-6 rounded-4xl border shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center gap-6",
                req.isQuotaExceeded ? "bg-red-50 border-red-200" : "bg-white border-zinc-100"
              )}
            >
              <div className="flex items-center gap-4 min-w-[200px]">
                <div className="w-12 h-12 rounded-2xl bg-zinc-100 flex items-center justify-center text-zinc-900 font-black text-xl shadow-inner border border-zinc-100 overflow-hidden">
                  {(req as any).userPhoto ? (
                    <img src={(req as any).userPhoto} alt={req.userName} className="w-full h-full object-cover" />
                  ) : (
                    req.userName?.charAt(0) || <User size={20} className="text-zinc-400" />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-zinc-900">{req.userName}</h3>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{req.userRole}</p>
                </div>
              </div>

              <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
                    <Calendar size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-black text-zinc-900">{req.leaveType}</p>
                    {req.startTime ? (
                      <p className="text-[10px] font-bold text-zinc-500">
                        {formatDate(req.startDate)} • {req.startTime} - {req.endTime}
                      </p>
                    ) : (
                      <p className="text-[10px] font-bold text-zinc-500">{formatDate(req.startDate)} - {formatDate(req.endDate)}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-zinc-50 flex items-center justify-center text-zinc-400">
                    <MessageSquare size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-0.5">Reason</p>
                    <p className="text-xs font-medium text-zinc-700 line-clamp-1 italic">"{req.reason}"</p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <div className={cn(
                    "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border",
                    req.status === 'Approved' ? "bg-green-50 text-green-700 border-green-100" :
                      req.status === 'Rejected' && req.approvedBy ? "bg-red-50 text-red-700 border-red-100" :
                        req.status === 'Rejected' && !req.approvedBy ? "bg-zinc-50 text-zinc-700 border-zinc-100" :
                          req.status === 'Cancelled' ? "bg-purple-50 text-purple-700 border-purple-100" :
                            "bg-amber-50 text-amber-700 border-amber-100"
                  )}>
                    {req.status === 'Rejected' && !req.approvedBy ? 'Unapproved' : req.status === 'Cancelled' ? 'Untaken' : req.status}
                  </div>
                  {req.imageUrl && (
                    <a
                      href={req.imageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-zinc-50 hover:bg-zinc-100 rounded-xl text-zinc-400 hover:text-orange-500 transition-all"
                      title="View Attachment"
                    >
                      <Camera size={20} />
                    </a>
                  )}
                </div>
              </div>

              <div className="flex gap-2 min-w-[120px] justify-end">
                {req.status === 'Pending' && canApprove(req) ? (
                  <>
                    <button
                      onClick={() => handleAction(req, 'Approved')}
                      className="p-3 bg-green-500 text-white rounded-2xl hover:bg-green-600 transition-all shadow-lg shadow-green-100"
                    >
                      <Check size={20} />
                    </button>
                    <button
                      onClick={() => handleAction(req, 'Rejected')}
                      className="p-3 bg-white text-red-500 border border-red-500/30 rounded-2xl hover:bg-red-50 transition-all"
                    >
                      <X size={20} />
                    </button>
                  </>
                ) : req.status === 'Pending' && (req.userId === user?.uid || user?.role === 'hr' || user?.role === 'owner' || user?.role === 'super') ? (
                  <>
                    <button
                      onClick={() => handleEdit(req)}
                      className="p-3 bg-zinc-100 text-zinc-600 rounded-2xl hover:bg-zinc-200 transition-all shadow-sm"
                      title="Edit"
                    >
                      <Pencil size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(req.id!)}
                      className="p-3 bg-red-50 text-red-500 rounded-2xl hover:bg-red-100 transition-all shadow-sm"
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </>
                ) : req.status === 'Pending' && !canApprove(req) ? (
                  <div className="flex items-center gap-2 text-zinc-400 px-4 py-2 bg-zinc-50 rounded-xl border border-zinc-100">
                    <Clock size={16} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Awaiting HR</span>
                  </div>
                ) : (
                  <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-right flex items-center gap-2">
                    <div>
                      Processed by<br />
                      <span className="text-zinc-900">{req.approvedBy}</span>
                    </div>
                    {(req.status === 'Rejected' || req.status === 'Approved') && (user?.role === 'hr' || user?.role === 'owner' || user?.role === 'super') && (
                      <button
                        onClick={() => req.status === 'Approved' ? handleCancelApproved(req) : handleDelete(req.id!)}
                        className="p-2.5 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-all ml-2"
                        title={req.status === 'Approved' ? "Cancel Approved Request" : "Delete Rejected Request"}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* 📝 native Apply Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-zinc-900/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-4xl shadow-2xl border border-zinc-100 overflow-hidden"
            >
              <div className="p-8 border-b border-zinc-50 flex items-center justify-between bg-zinc-50/50">
                <h2 className="text-2xl font-black text-zinc-900">
                  {editingLeaveId ? 'Edit Leave Request' : 'Apply for Leave (Latest Version)'}
                </h2>
                <button onClick={() => { setIsModalOpen(false); setEditingLeaveId(null); }} className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-xl transition-all">
                  <XCircle size={24} />
                </button>
              </div>
              <form onSubmit={handleSubmitLeave} className="p-8 space-y-6">
                <div>
                  <label className="block text-xs font-black text-zinc-500 uppercase tracking-widest mb-2 ml-1">Type of Leave</label>
                  <select
                    value={leaveType}
                    onChange={(e) => setLeaveType(e.target.value as any)}
                    className="w-full px-5 py-4 rounded-2xl bg-zinc-50 border border-zinc-100 focus:ring-2 focus:ring-orange-500 focus:bg-white outline-none transition-all font-bold text-zinc-800"
                  >
                    <option value="Annual">Annual Leave</option>
                    <option value="Sick">Sick Leave</option>
                    <option value="Casual">Casual Leave</option>
                    <option value="Short">Short Leave</option>
                  </select>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-zinc-500 uppercase tracking-widest mb-2 ml-1">
                      {leaveType.toLowerCase() === 'short' ? 'Date' : 'Start Date'}
                    </label>
                    <input
                      type="date"
                      required
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-5 py-4 rounded-2xl bg-zinc-50 border border-zinc-100 focus:ring-2 focus:ring-orange-500 focus:bg-white outline-none transition-all font-bold text-zinc-800"
                    />
                  </div>
                  {leaveType.toLowerCase() !== 'short' ? (
                    <div>
                      <label className="block text-xs font-black text-zinc-500 uppercase tracking-widest mb-2 ml-1">End Date</label>
                      <input
                        type="date"
                        required
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full px-5 py-4 rounded-2xl bg-zinc-50 border border-zinc-100 focus:ring-2 focus:ring-orange-500 focus:bg-white outline-none transition-all font-bold text-zinc-800"
                      />
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-black text-zinc-500 uppercase tracking-widest mb-2">From (Time)</label>
                        <input
                          type="time"
                          required
                          value={startTime}
                          onChange={(e) => setStartTime(e.target.value)}
                          className="w-full px-3 py-4 rounded-2xl bg-zinc-50 border border-zinc-100 focus:ring-2 focus:ring-orange-500 focus:bg-white outline-none transition-all font-bold text-zinc-800"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-black text-zinc-500 uppercase tracking-widest mb-2">To (Time)</label>
                        <input
                          type="time"
                          required
                          value={endTime}
                          onChange={(e) => setEndTime(e.target.value)}
                          className="w-full px-3 py-4 rounded-2xl bg-zinc-50 border border-zinc-100 focus:ring-2 focus:ring-orange-500 focus:bg-white outline-none transition-all font-bold text-zinc-800"
                        />
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-black text-zinc-500 uppercase tracking-widest mb-2 ml-1">Reason</label>
                  <textarea
                    required
                    rows={3}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full px-5 py-4 rounded-2xl bg-zinc-50 border border-zinc-100 focus:ring-2 focus:ring-orange-500 focus:bg-white outline-none transition-all resize-none font-medium"
                    placeholder="Briefly describe your reason..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-zinc-500 uppercase tracking-widest mb-2 ml-1">Attachment (Optional)</label>
                  <label className="flex items-center justify-center gap-2 w-full px-5 py-4 rounded-2xl bg-zinc-50 border border-dashed border-zinc-200 hover:border-orange-300 hover:bg-orange-50 transition-all cursor-pointer group">
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                    <Camera size={20} className="text-zinc-400 group-hover:text-orange-500" />
                    <span className="text-sm font-bold text-zinc-500 group-hover:text-orange-600">
                      {leaveImage ? 'Image Attached ✅' : 'Upload Medical/Document'}
                    </span>
                  </label>
                </div>
                <div className="pt-4 flex gap-4">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-orange-500 text-white px-6 py-4 rounded-2xl font-black hover:bg-orange-600 transition-all shadow-xl shadow-orange-100 disabled:opacity-50"
                  >
                    {submitting ? 'Submitting...' : 'Confirm Request'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ⚠️ Quota Exceeded Warning Modal */}
      <AnimatePresence>
        {showQuotaWarning && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setShowQuotaWarning(false); setPendingSubmitData(null); }}
              className="absolute inset-0 bg-zinc-900/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-zinc-100 overflow-hidden"
            >
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <AlertCircle size={32} />
                </div>
                <h2 className="text-2xl font-black text-zinc-900 mb-2">Leave Quota Exceeded</h2>
                <p className="text-zinc-500 font-medium mb-8">
                  You are applying for leave that exceeds the monthly limit of 1.5 days. Do you want to continue?
                </p>
                <div className="flex gap-4">
                  <button
                    onClick={() => { setShowQuotaWarning(false); setPendingSubmitData(null); }}
                    className="flex-1 px-6 py-4 rounded-2xl font-bold text-zinc-600 bg-zinc-100 hover:bg-zinc-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => proceedSubmit(pendingSubmitData)}
                    className="flex-1 px-6 py-4 rounded-2xl font-bold text-white bg-orange-500 hover:bg-orange-600 transition-all shadow-lg shadow-orange-100"
                  >
                    Yes, Continue
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── types for internal use ──────────────────────────────────────────────────
type LeaveType = 'Annual' | 'Sick' | 'Casual' | 'Short';
