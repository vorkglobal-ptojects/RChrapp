import React, { useState, useEffect } from 'react';
import { 
  Settings, DollarSign, Plus, Search, 
  Filter, Edit2, Check, X, ArrowUpRight, ArrowDownRight, Lock
} from 'lucide-react';
import { PayrollRecord, UserProfile } from '../types';
import * as supabaseService from '../services/supabaseService';
import { useAuth } from '../hooks/useAuth';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

export default function ManagePayroll() {
  const { user } = useAuth();
  const [payrolls, setPayrolls] = useState<PayrollRecord[]>([]);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<PayrollRecord>>({});
  const [loading, setLoading] = useState(true);
  const [justPaidIds, setJustPaidIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await supabaseService.getPayroll();
      setPayrolls(data || []);
    } catch (err) {
      console.error('Error loading payroll data:', err);
      toast.error('Failed to load payrolls');
    } finally {
      setLoading(false);
    }
  };

  const filteredPayrolls = payrolls.filter(p => {
    const matchesSearch = p.userName.toLowerCase().includes(search.toLowerCase());
    
    // Only show Pending payrolls, but explicitly KEEP the ones they just paid in this session 
    // so they can see the "Payment Processed" button successfully as requested.
    if (p.status !== 'Pending' && (!p.id || !justPaidIds.has(p.id))) {
      return false;
    }
    
    // HR can see all pending payroll, but cannot edit their own (enforced below)
    return matchesSearch;
  });

  const handleSave = async (id: string) => {
    try {
      const original = payrolls.find(p => p.id === id);
      if (!original) return;

      const intensive = Number(editData.intensive ?? original.intensive) || 0;
      const advances = Number(editData.advances ?? original.advances) || 0;
      const travelling = Number(editData.travelling ?? original.travelling) || 0;
      const epf = Number(editData.epf ?? original.epf) || 0;
      const cover = Number(editData.cover ?? original.cover) || 0;
      const salaryA = Number(original.salaryA) || 0;
      
      // New Formula: Net = SalaryA - EPF - Advances - Cover + Intensive + Travelling
      const netSalary = salaryA - epf - advances - cover + intensive + travelling;

      await supabaseService.updatePayroll(id, {
        ...editData,
        epf,
        salaryB: 0,
        netSalary: isNaN(netSalary) ? 0 : netSalary
      });
      
      toast.success('Payroll updated');
      setEditingId(null);
      setEditData({});
      loadData();
    } catch (err) {
      console.error('Error saving payroll:', err);
      toast.error('Failed to update: ' + (err.message || 'unknown error'));
    }
  };

  const handleMarkAsPaid = async (id: string) => {
    try {
      await supabaseService.updatePayroll(id, { status: 'Paid' });
      toast.success('Marked as paid');
      setJustPaidIds(prev => {
        const next = new Set(prev);
        next.add(id);
        return next;
      });
      loadData();
    } catch (err: any) {
      console.error('Error processing payment:', err);
      toast.error('Payment failed: ' + (err.message || 'unknown error'));
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-black text-zinc-900">Manage Payroll</h1>
        <p className="text-zinc-500 font-medium">Adjust incentives, deductions and process payments</p>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-4xl border border-zinc-100 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
          <input 
            type="text" 
            placeholder="Search pending payrolls..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-zinc-50 border border-zinc-100 rounded-2xl text-sm focus:ring-2 focus:ring-orange-500 outline-none transition-all"
          />
        </div>
      </div>

      {/* Payroll Management List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredPayrolls.map((p) => (
          <div 
            key={p.id || `p-${Math.random()}`}
            className="bg-white p-6 rounded-[2.5rem] border border-zinc-100 shadow-sm hover:shadow-md transition-all flex flex-col lg:flex-row lg:items-center gap-6"
          >
            <div className="flex items-center gap-4 min-w-[200px]">
              <div className="w-12 h-12 rounded-2xl bg-zinc-100 flex items-center justify-center text-zinc-500 font-black">
                {p.userName?.charAt(0) || '?'}
              </div>
              <div>
                <h3 className="font-bold text-zinc-900">{p.userName || 'Unknown'}</h3>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{p.branch || 'General'}</p>
              </div>
            </div>

            <div className="flex-1 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
              <div>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Salary A</p>
                <p className="text-sm font-black text-zinc-900">{(p.salaryA || 0).toLocaleString()}</p>
              </div>

              <div>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Intensive</p>
                {editingId === p.id ? (
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
                {editingId === p.id ? (
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
                {editingId === p.id && p.userName === 'Dilini Sanarathna' ? (
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
                {editingId === p.id ? (
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
                {editingId === p.id ? (
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
              {editingId === p.id ? (
                <>
                  <button 
                    onClick={() => handleSave(p.id!)}
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
                  {(user?.role === 'super' || user?.role === 'owner') ? (
                    <>
                      {p.status === 'Paid' || justPaidIds.has(p.id!) ? (
                        <button 
                          disabled
                          className="px-6 py-3 bg-zinc-200 text-zinc-500 rounded-2xl font-bold text-xs shadow-inner flex items-center gap-2 cursor-not-allowed"
                        >
                          <Check size={16} />
                          Payment Processed
                        </button>
                      ) : (
                        <>
                          <button 
                            onClick={() => setEditingId(p.id!)}
                            className="px-4 py-3 bg-zinc-50 text-zinc-600 rounded-2xl font-bold text-xs hover:bg-zinc-100 transition-all flex items-center gap-2"
                          >
                            <Edit2 size={16} />
                            Adjust
                          </button>
                          <button 
                            onClick={() => handleMarkAsPaid(p.id!)}
                            className="px-6 py-3 bg-orange-500 text-white rounded-2xl font-bold text-xs hover:bg-orange-600 transition-all shadow-lg shadow-orange-100 flex items-center gap-2"
                          >
                            <DollarSign size={16} />
                            Process Payment
                          </button>
                        </>
                      )}
                    </>
                  ) : (
                    <div className="flex items-center gap-2 px-4 py-3 bg-zinc-50 border border-zinc-100 rounded-2xl text-[10px] font-bold text-zinc-400 uppercase tracking-widest shadow-inner">
                      <Lock size={14} className="text-zinc-300" />
                      Self-Management Restricted
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
