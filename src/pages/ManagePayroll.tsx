import React, { useState, useEffect } from 'react';
import { 
  Settings, DollarSign, Plus, Search, 
  Filter, Edit2, Check, X, ArrowUpRight, ArrowDownRight, Lock
} from 'lucide-react';
import { PayrollRecord, UserProfile } from '../types';
import * as payrollService from '../services/payrollService';
import * as userService from '../services/userService';
import { useAuth } from '../hooks/useAuth';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

export default function ManagePayroll() {
  const { user } = useAuth();
  const [payrolls, setPayrolls] = useState<PayrollRecord[]>([]);
  const [employees, setEmployees] = useState<UserProfile[]>([]);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<PayrollRecord>>({});
  const [loading, setLoading] = useState(true);
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth());
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [filterBranch, setFilterBranch] = useState('All Branches');
  const [justPaidIds, setJustPaidIds] = useState<Set<string>>(new Set());
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [payrollData, employeeData] = await Promise.all([
        payrollService.getPayroll(),
        userService.getEmployees()
      ]);
      setPayrolls(payrollData || []);
      setEmployees(employeeData || []);
    } catch (err) {
      console.error('Error loading payroll data:', err);
      toast.error('Failed to load payrolls');
    } finally {
      setLoading(false);
    }
  };

  const branches = ['All Branches', ...Array.from(new Set(employees.map(p => p.branch || 'General')))];

  // ─── Consolidation Logic ──────────────────────────────────────────────────
  // We want to show ALL employees, matched with their payroll for this month.
  const displayList = employees
    .filter(emp => {
      // 1. Filter by Search
      const matchesSearch = emp.name.toLowerCase().includes(search.toLowerCase());
      // 2. Filter by Branch
      const matchesBranch = filterBranch === 'All Branches' || 
                           emp.branch?.toLowerCase() === filterBranch.toLowerCase();
      // 3. Skip admins/owners for payroll management
      const isManageable = emp.role !== 'owner' && emp.role !== 'super';
      
      return matchesSearch && matchesBranch && isManageable;
    })
    .map(emp => {
      // Find existing record
      const record = payrolls.find(p => 
        p.userId === emp.uid && 
        p.month === (filterMonth + 1) && 
        p.year === filterYear
      );

      if (record) return record;

      // Create a "Draft" record based on profile
      return {
        userId: emp.uid,
        userName: emp.name,
        branch: emp.branch,
        month: filterMonth + 1,
        year: filterYear,
        salaryA: emp.salaryA,
        salaryB: 0,
        epf: emp.epf,
        advances: emp.advances || 0,
        cover: emp.cover || 0,
        intensive: emp.intensive || 0,
        travelling: emp.travelling || 0,
        netSalary: (emp.salaryA || 0) + (emp.intensive || 0) + (emp.travelling || 0) - emp.epf - (emp.advances || 0) - (emp.cover || 0),
        status: 'Pending' as const,
        isDraft: true // Visual flag
      };
    });

  const handleSave = async (userId: string, isDraft: boolean, recordId?: string) => {
    try {
      const original = isDraft 
        ? displayList.find(p => p.userId === userId)
        : payrolls.find(p => p.id === recordId);
        
      if (!original) return;

      const intensive = Number(editData.intensive ?? original.intensive) || 0;
      const advances = Number(editData.advances ?? original.advances) || 0;
      const travelling = Number(editData.travelling ?? original.travelling) || 0;
      const epf = Number(editData.epf ?? original.epf) || 0;
      const cover = Number(editData.cover ?? original.cover) || 0;
      const salaryA = Number(editData.salaryA ?? original.salaryA) || 0;
      
      const netSalary = salaryA - epf - advances - cover + intensive + travelling;

      if (isDraft) {
        // Use payrollService to save (it handles insert/update logic if we want, or I'll just use service calls)
        await payrollService.savePayroll({
          userId,
          month: filterMonth + 1,
          year: filterYear,
          salaryA,
          salaryB: 0,
          epf,
          advances,
          cover,
          intensive,
          travelling,
          netSalary,
          status: 'Pending',
          branch: original.branch
        });
      } else if (recordId) {
        // UPDATE existing
        await payrollService.updatePayroll(recordId, {
          ...editData,
          epf,
          salaryB: 0,
          netSalary: isNaN(netSalary) ? 0 : netSalary
        });
      }
      
      toast.success(isDraft ? 'Payroll generated' : 'Payroll updated');
      setEditingId(null);
      setEditData({});
      loadData();
    } catch (err: any) {
      console.error('Error saving payroll:', err);
      toast.error('Failed to save: ' + (err.message || 'unknown error'));
    }
  };

  const handleMarkAsPaid = async (userId: string, isDraft: boolean, recordId?: string) => {
    if (!window.confirm('Are you sure you want to mark this as paid? This will lock the record.')) return;
    try {
      if (isDraft) {
        const original = displayList.find(p => p.userId === userId);
        if (!original) return;
        await payrollService.savePayroll({ ...original, status: 'Paid' });
      } else if (recordId) {
        await payrollService.updatePayroll(recordId, { status: 'Paid' });
      }
      toast.success('Payment marked as processed');
      loadData();
    } catch (err: any) {
      console.error('Error processing payment:', err);
      toast.error('Payment failed: ' + (err.message || 'unknown error'));
    }
  };

  const handleUndoPayment = async (recordId: string) => {
    if (!window.confirm('Revert payment status to pending?')) return;
    try {
      await payrollService.updatePayroll(recordId, { status: 'Pending' });
      toast.success('Payment status reverted to pending');
      loadData();
    } catch (err) {
      toast.error('Failed to revert status');
    }
  };

  const handleGenerateAll = async () => {
    setIsGeneratingAll(true);
    try {
      await payrollService.generatePayroll(filterMonth + 1, filterYear);
      toast.success(`Payroll for ${months[filterMonth]} ${filterYear} generated for all staff`);
      loadData();
    } catch (err) {
      toast.error('Generation failed');
    } finally {
      setIsGeneratingAll(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-zinc-900">Manage Payroll</h1>
          <p className="text-zinc-500 font-medium">Adjust incentives, deductions and process payments</p>
        </div>
        <button 
          onClick={handleGenerateAll}
          disabled={isGeneratingAll}
          className="bg-zinc-900 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-100 disabled:opacity-50"
        >
          {isGeneratingAll ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Plus size={18} />
          )}
          Generate All for {months[filterMonth]}
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-4xl border border-zinc-100 shadow-sm flex flex-col lg:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
          <input 
            type="text" 
            placeholder="Search pending payrolls..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-zinc-50 border border-zinc-100 rounded-2xl text-sm focus:ring-2 focus:ring-orange-500 outline-none transition-all"
          />
        </div>
        <div className="flex flex-wrap gap-3 w-full lg:w-auto justify-end">
          <div className="flex items-center gap-2 bg-zinc-50 border border-zinc-100 rounded-2xl px-4 py-1">
            <Filter size={14} className="text-zinc-400" />
            <select 
              value={filterBranch}
              onChange={(e) => setFilterBranch(e.target.value)}
              className="py-2 bg-transparent text-sm font-bold text-zinc-600 outline-none min-w-[120px]"
            >
              {branches.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <select 
            value={filterMonth}
            onChange={(e) => setFilterMonth(Number(e.target.value))}
            className="px-4 py-3 bg-zinc-50 border border-zinc-100 rounded-2xl text-sm font-bold text-zinc-600 outline-none focus:ring-2 focus:ring-orange-500"
          >
            {months.map((m, i) => <option key={m} value={i}>{m}</option>)}
          </select>
          <select 
            value={filterYear}
            onChange={(e) => setFilterYear(Number(e.target.value))}
            className="px-4 py-3 bg-zinc-50 border border-zinc-100 rounded-2xl text-sm font-bold text-zinc-600 outline-none focus:ring-2 focus:ring-orange-500"
          >
            {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* Payroll Management List */}
      <div className="grid grid-cols-1 gap-4">
        {displayList.map((p) => {
          const isDraft = (p as any).isDraft;
          const uniqueId = isDraft ? `draft-${p.userId}` : p.id!;

          return (
            <div 
              key={uniqueId}
              className={cn(
                "bg-white p-6 rounded-[2.5rem] border border-zinc-100 shadow-sm hover:shadow-md transition-all flex flex-col lg:flex-row lg:items-center gap-6",
                isDraft && "border-dashed border-orange-200 bg-orange-50/10"
              )}
            >
              <div className="flex items-center gap-4 min-w-[200px]">
                <div className="w-12 h-12 rounded-2xl bg-zinc-100 flex items-center justify-center text-zinc-500 font-black relative">
                  {p.userName?.charAt(0) || '?'}
                  {isDraft && <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full border-2 border-white" />}
                </div>
                <div>
                  <h3 className="font-bold text-zinc-900">{p.userName || 'Unknown'}</h3>
                  <div className="flex items-center gap-2">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{p.branch || 'General'}</p>
                    {isDraft && <span className="text-[9px] font-black bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded uppercase tracking-tighter">Draft</span>}
                  </div>
                </div>
              </div>

              <div className="flex-1 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
                <div>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Salary A</p>
                  {editingId === uniqueId ? (
                    <input 
                      type="number" 
                      value={editData.salaryA ?? p.salaryA}
                      onChange={(e) => setEditData({ ...editData, salaryA: Number(e.target.value) })}
                      className="w-full px-3 py-1 bg-zinc-50 border border-zinc-100 rounded-lg text-sm font-bold text-zinc-900 outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  ) : (
                    <p className="text-sm font-black text-zinc-900">{(p.salaryA || 0).toLocaleString()}</p>
                  )}
                </div>

                <div>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Intensive</p>
                  {editingId === uniqueId ? (
                    <input 
                      type="number" 
                      value={editData.intensive ?? p.intensive}
                      onChange={(e) => setEditData({ ...editData, intensive: Number(e.target.value) })}
                      className="w-full px-3 py-1 bg-zinc-50 border border-zinc-100 rounded-lg text-sm font-bold text-green-600 outline-none focus:ring-2 focus:ring-green-500"
                    />
                  ) : (
                    <p className="text-sm font-black text-green-600">+{(p.intensive || 0).toLocaleString()}</p>
                  )}
                </div>

                <div>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Travelling</p>
                  {editingId === uniqueId ? (
                    <input 
                      type="number" 
                      value={editData.travelling ?? p.travelling}
                      onChange={(e) => setEditData({ ...editData, travelling: Number(e.target.value) })}
                      className="w-full px-3 py-1 bg-zinc-50 border border-zinc-100 rounded-lg text-sm font-bold text-green-600 outline-none focus:ring-2 focus:ring-green-500"
                    />
                  ) : (
                    <p className="text-sm font-black text-green-600">+{(p.travelling || 0).toLocaleString()}</p>
                  )}
                </div>

                <div>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">EPF</p>
                  {editingId === uniqueId ? (
                    <input 
                      type="number" 
                      value={editData.epf ?? p.epf}
                      onChange={(e) => setEditData({ ...editData, epf: Number(e.target.value) })}
                      className="w-full px-3 py-1 bg-zinc-50 border border-zinc-100 rounded-lg text-sm font-bold text-red-600 outline-none focus:ring-2 focus:ring-red-500"
                    />
                  ) : (
                    <p className="text-sm font-black text-red-600">-{p.epf.toLocaleString()}</p>
                  )}
                </div>

                <div>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Advances</p>
                  {editingId === uniqueId ? (
                    <input 
                      type="number" 
                      value={editData.advances ?? p.advances}
                      onChange={(e) => setEditData({ ...editData, advances: Number(e.target.value) })}
                      className="w-full px-3 py-1 bg-zinc-50 border border-zinc-100 rounded-lg text-sm font-bold text-red-600 outline-none focus:ring-2 focus:ring-red-500"
                    />
                  ) : (
                    <p className="text-sm font-black text-red-600">-{(p.advances || 0).toLocaleString()}</p>
                  )}
                </div>

                <div>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Cover</p>
                  {editingId === uniqueId ? (
                    <input 
                      type="number" 
                      value={editData.cover ?? p.cover}
                      onChange={(e) => setEditData({ ...editData, cover: Number(e.target.value) })}
                      className="w-full px-3 py-1 bg-zinc-50 border border-zinc-100 rounded-lg text-sm font-bold text-red-600 outline-none focus:ring-2 focus:ring-red-500"
                    />
                  ) : (
                    <p className="text-sm font-black text-red-600">-{(p.cover || 0).toLocaleString()}</p>
                  )}
                </div>

                <div>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1 text-orange-500">Net Payout</p>
                  <p className="text-sm font-black text-orange-600">LKR {(p.netSalary || 0).toLocaleString()}</p>
                </div>
              </div>

              <div className="flex gap-2">
                {editingId === uniqueId ? (
                  <>
                    <button 
                      onClick={() => handleSave(p.userId, isDraft, p.id)}
                      className="p-3 bg-green-500 text-white rounded-2xl hover:bg-green-600 transition-all shadow-lg shadow-green-100"
                    >
                      <Check size={20} />
                    </button>
                    <button 
                      onClick={() => { setEditingId(null); setEditData({}); }}
                      className="p-3 bg-zinc-100 text-zinc-400 rounded-2xl hover:bg-zinc-200 transition-all"
                    >
                      <X size={20} />
                    </button>
                  </>
                ) : (
                  <>
                    {(user?.role === 'super' || user?.role === 'owner' || user?.role === 'hr') ? (
                      <>
                        {p.userId === user?.uid ? (
                          <div className="flex items-center gap-2 px-4 py-3 bg-zinc-50 border border-zinc-100 rounded-2xl text-[10px] font-bold text-zinc-400 uppercase tracking-widest shadow-inner">
                            <Lock size={14} className="text-zinc-300" />
                            Self-Management Restricted
                          </div>
                        ) : (
                          <>
                            {(!isDraft && (p.status === 'Paid' || justPaidIds.has(p.id!))) ? (
                              <button 
                                onDoubleClick={() => p.id && handleUndoPayment(p.id)}
                                className="px-6 py-3 bg-zinc-200 text-zinc-500 rounded-2xl font-bold text-xs shadow-inner flex items-center gap-2 cursor-pointer hover:bg-zinc-300 transition-all"
                                title="Double-click to undo payment"
                              >
                                <Check size={16} />
                                Payment Processed
                              </button>
                            ) : (
                              <>
                                <button 
                                  onClick={() => setEditingId(uniqueId)}
                                  className="px-4 py-3 bg-zinc-50 text-zinc-600 rounded-2xl font-bold text-xs hover:bg-zinc-100 transition-all flex items-center gap-2"
                                >
                                  <Edit2 size={16} />
                                  {isDraft ? 'Initialize' : 'Adjust'}
                                </button>
                                <button 
                                  onClick={() => handleMarkAsPaid(p.userId, isDraft, p.id)}
                                  className="px-6 py-3 bg-orange-500 text-white rounded-2xl font-bold text-xs hover:bg-orange-600 transition-all shadow-lg shadow-orange-100 flex items-center gap-2"
                                >
                                  <DollarSign size={16} />
                                  Process Payment
                                </button>
                              </>
                            )}
                          </>
                        )}
                      </>
                    ) : (
                      <div className="flex items-center gap-2 px-4 py-3 bg-zinc-50 border border-zinc-100 rounded-2xl text-[10px] font-bold text-zinc-400 uppercase tracking-widest shadow-inner">
                        <Lock size={14} className="text-zinc-300" />
                        Access Restricted
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}

        {displayList.length === 0 && (
          <div className="bg-white p-12 rounded-4xl border border-zinc-100 text-center space-y-4">
            <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mx-auto text-zinc-300">
              <Search size={32} />
            </div>
            <div>
              <p className="text-zinc-900 font-bold text-lg">No employees found</p>
              <p className="text-zinc-400">Try adjusting your search or branch filter</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
