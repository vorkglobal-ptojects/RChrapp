import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, XCircle, Clock, Filter, 
  Search, Coins, Plus, Trash2, User, 
  MessageSquare, Calendar, Check, X, CreditCard
} from 'lucide-react';
import { AdvanceRequest } from '../types';
import * as advanceService from '../services/advanceService';
import { useAuth } from '../hooks/useAuth';
import { cn, formatDate } from '../lib/utils';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';

export default function Advances() {
  const { user } = useAuth();
  const [advances, setAdvances] = useState<AdvanceRequest[]>([]);
  const [filter, setFilter] = useState<'All' | 'Pending' | 'Approved' | 'Rejected'>('All');
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const isManagement = user.role === 'hr' || user.role === 'owner' || user.role === 'super';
      const data = await advanceService.getAdvances(isManagement ? undefined : user.uid);
      setAdvances(data || []);
    } catch (err) {
      console.error('Error loading advances:', err);
      toast.error('Failed to sync advances');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.uid, user?.role]);

  const handleSubmitAdvance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const requestAmount = Number(amount);
    if (isNaN(requestAmount) || requestAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    
    setSubmitting(true);
    try {
      const advanceData = {
        userId: user.uid,
        amount: requestAmount,
        reason: reason,
        status: 'Pending' as const
      };

      await advanceService.submitAdvance(advanceData);
      toast.success('Salary advance request submitted successfully!');
      
      setIsModalOpen(false);
      setAmount('');
      setReason('');
      loadData();
    } catch (error: any) {
      console.error('Submission error:', error);
      toast.error(error.message || 'Failed to submit advance request. Check your permissions.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAction = async (id: string, status: 'Approved' | 'Rejected', employeeId: string, requestAmount: number) => {
    if (!user) return;
    try {
      await advanceService.updateAdvanceStatus(id, status, user.uid, employeeId, requestAmount);
      toast.success(`Advance request ${status.toLowerCase()}`);
      loadData();
    } catch (err) {
      console.error('Action error:', err);
      toast.error('Failed to update request');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this request?')) return;
    try {
      await advanceService.deleteAdvance(id);
      toast.success('Request deleted');
      loadData();
    } catch (err) {
      toast.error('Failed to delete request');
    }
  };

  const filteredAdvances = advances.filter(a => {
    const matchesFilter = filter === 'All' || a.status === filter;
    const matchesSearch = (a.userName || '').toLowerCase().includes(search.toLowerCase()) || 
                          (a.reason || '').toLowerCase().includes(search.toLowerCase()) ||
                          String(a.amount).includes(search);
    return matchesFilter && matchesSearch;
  });

  const canApprove = (req: AdvanceRequest) => {
    if (!user) return false;
    const myRole = user.role;
    const theirRole = req.userRole;

    // Management (Owner, HR, Super) can approve Employees
    if ((myRole === 'owner' || myRole === 'hr' || myRole === 'super') && theirRole === 'employee') return true;
    
    // Owners can approve HR and Super as well
    if (myRole === 'owner' && (theirRole === 'hr' || theirRole === 'super')) return true;

    return false;
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-zinc-900">Salary Advances</h1>
          <p className="text-zinc-500 font-medium tracking-tight">Request and manage salary advance payments</p>
        </div>
        {(user?.role === 'employee' || user?.role === 'hr') && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-orange-500 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-2 hover:bg-orange-600 transition-all shadow-xl shadow-orange-100"
          >
            <Plus size={20} />
            Request Advance
          </button>
        )}
      </div>

      {/* 📊 My Advances Summary (Strategic for Employees & HR) */}
      {(user?.role === 'employee' || user?.role === 'hr') && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Total Active Advances</p>
              <p className="text-2xl font-black text-orange-600">
                LKR {(user?.advances || 0).toLocaleString()}
                <span className="text-[10px] block opacity-60">To be deducted from your next payroll</span>
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-500">
              <CreditCard size={24} />
            </div>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Pending Advance Requests</p>
              <p className="text-2xl font-black text-zinc-900">
                {advances.filter(a => a.status === 'Pending').length} Request(s)
                <span className="text-[10px] block opacity-60">Awaiting management approval</span>
              </p>
            </div>
            <div className="w-12 h-12 bg-zinc-50 rounded-2xl flex items-center justify-center text-zinc-500">
              <Clock size={24} />
            </div>
          </div>
        </div>
      )}

      {/* Global Stats Summary for Managers */}
      {(user?.role === 'hr' || user?.role === 'owner' || user?.role === 'super') && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: 'Pending Requests', value: advances.filter(a => a.status === 'Pending').length, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100' },
            { label: 'Total Requests', value: advances.length, icon: Calendar, color: 'text-zinc-600', bg: 'bg-zinc-100' },
            { label: 'Approved Today', value: advances.filter(a => a.status === 'Approved').length, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-100' },
            { label: 'Total LKR Approved', value: `LKR ${advances.filter(a => a.status === 'Approved').reduce((s, a) => s + (a.amount || 0), 0).toLocaleString()}`, icon: Coins, color: 'text-orange-600', bg: 'bg-orange-50' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", stat.bg, stat.color)}>
                  <stat.icon size={18} />
                </div>
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{stat.label}</span>
              </div>
              <p className="text-xl font-black text-zinc-900">{stat.value}</p>
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
            placeholder="Search advances..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-zinc-50 border border-zinc-100 rounded-2xl text-sm focus:ring-2 focus:ring-zinc-900 outline-none transition-all"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {['All', 'Pending', 'Approved', 'Rejected'].map((f) => (
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
        {loading ? (
          <div className="text-center py-12">
            <div className="w-10 h-10 border-4 border-zinc-200 border-t-orange-500 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm font-bold text-zinc-500">Syncing advance requests...</p>
          </div>
        ) : filteredAdvances.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-4xl border border-zinc-100 shadow-sm">
            <Coins size={40} className="mx-auto text-zinc-300 mb-3" />
            <p className="text-zinc-500 font-bold">No advance requests found.</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {filteredAdvances.map((req) => (
              <motion.div
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                key={req.id}
                className="bg-white p-6 rounded-4xl border border-zinc-100 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center gap-6"
              >
                <div className="flex items-center gap-4 min-w-[200px]">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-100 flex items-center justify-center text-zinc-900 font-black text-xl shadow-inner border border-zinc-100 overflow-hidden">
                    {req.userPhoto ? (
                      <img src={req.userPhoto} alt={req.userName} className="w-full h-full object-cover" />
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
                      <Coins size={18} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Amount Requested</p>
                      <p className="text-lg font-black text-zinc-900">
                        LKR {(req.amount || 0).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 col-span-2 md:col-span-1">
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
                      req.status === 'Rejected' ? "bg-red-50 text-red-700 border-red-100" :
                      "bg-amber-50 text-amber-700 border-amber-100"
                    )}>
                      {req.status}
                    </div>
                    <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-right">
                      Requested on<br/>
                      <span className="text-zinc-950 font-bold">{formatDate(req.createdAt)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 min-w-[120px] justify-end">
                  {req.status === 'Pending' && canApprove(req) ? (
                    <>
                      <button 
                        onClick={() => handleAction(req.id!, 'Approved', req.userId, req.amount)}
                        className="p-3 bg-green-500 text-white rounded-2xl hover:bg-green-600 transition-all shadow-lg shadow-green-100"
                        title="Approve Request"
                      >
                        <Check size={20} />
                      </button>
                      <button 
                        onClick={() => handleAction(req.id!, 'Rejected', req.userId, req.amount)}
                        className="p-3 bg-white text-red-500 border border-red-500/30 rounded-2xl hover:bg-red-50 transition-all"
                        title="Reject Request"
                      >
                        <X size={20} />
                      </button>
                    </>
                  ) : req.status === 'Pending' && (req.userId === user?.uid) ? (
                    <button 
                      onClick={() => handleDelete(req.id!)}
                      className="p-3 bg-red-50 text-red-500 rounded-2xl hover:bg-red-100 transition-all shadow-sm"
                      title="Delete Request"
                    >
                      <Trash2 size={18} />
                    </button>
                  ) : req.status === 'Pending' && !canApprove(req) ? (
                    <div className="flex items-center gap-2 text-zinc-400 px-4 py-2 bg-zinc-50 rounded-xl border border-zinc-100">
                      <Clock size={16} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Awaiting HR</span>
                    </div>
                  ) : (
                    <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-right flex items-center gap-2">
                      <div>
                        Processed by<br/>
                        <span className="text-zinc-900 font-extrabold">{req.approvedBy || 'System'}</span>
                      </div>
                      {req.status === 'Rejected' && (user?.role === 'hr' || user?.role === 'owner' || user?.role === 'super' || req.userId === user?.uid) && (
                        <button 
                          onClick={() => handleDelete(req.id!)}
                          className="p-2.5 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-all ml-2"
                          title="Delete Request"
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
        )}
      </div>

      {/* 📝 Request Advance Modal */}
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
                  Request Salary Advance
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-xl transition-all">
                  <XCircle size={24} />
                </button>
              </div>
              <form onSubmit={handleSubmitAdvance} className="p-8 space-y-6">
                <div>
                  <label className="block text-xs font-black text-zinc-500 uppercase tracking-widest mb-2 ml-1">Advance Amount (LKR)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="Enter amount (e.g. 15000)"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-5 py-4 rounded-2xl bg-zinc-50 border border-zinc-100 focus:ring-2 focus:ring-orange-500 focus:bg-white outline-none transition-all font-bold text-zinc-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-zinc-500 uppercase tracking-widest mb-2 ml-1">Reason for Advance</label>
                  <textarea
                    required
                    rows={4}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full px-5 py-4 rounded-2xl bg-zinc-50 border border-zinc-100 focus:ring-2 focus:ring-orange-500 focus:bg-white outline-none transition-all resize-none font-medium text-zinc-800"
                    placeholder="Briefly explain the reason for the advance request..."
                  />
                </div>
                <div className="pt-4 flex gap-4">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-orange-500 text-white px-6 py-4 rounded-2xl font-black hover:bg-orange-600 transition-all shadow-xl shadow-orange-100 disabled:opacity-50"
                  >
                    {submitting ? 'Submitting...' : 'Submit Request'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
