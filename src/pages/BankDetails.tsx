import React, { useState, useEffect } from 'react';
import { 
  CreditCard, Download, Search, Filter, 
  Copy, Check, Sparkles, AlertCircle, UserCheck, UserMinus
} from 'lucide-react';
import { UserProfile } from '../types';
import * as userService from '../services/userService';
import { useAuth } from '../hooks/useAuth';
import { cn } from '../lib/utils';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

export default function BankDetails() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterBranch, setFilterBranch] = useState('All Branches');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await userService.getEmployees();
      // Filter out super admins as they don't submit bank details
      const filteredData = (data || []).filter(emp => emp.role !== 'super');
      setEmployees(filteredData);
    } catch (err) {
      console.error('Error loading employee profiles:', err);
      toast.error('Failed to load bank details data');
    } finally {
      setLoading(false);
    }
  };

  const branches = ['All Branches', ...Array.from(new Set(employees.map(p => p.branch).filter(Boolean)))];

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = emp.name.toLowerCase().includes(search.toLowerCase()) ||
      (emp.bankName || '').toLowerCase().includes(search.toLowerCase()) ||
      (emp.bankBranch || '').toLowerCase().includes(search.toLowerCase()) ||
      (emp.nickname || '').toLowerCase().includes(search.toLowerCase());
    const matchesBranch = filterBranch === 'All Branches' || 
      emp.branch?.toLowerCase() === filterBranch.toLowerCase();
    return matchesSearch && matchesBranch;
  });

  const totalEligible = employees.length;
  const totalActive = employees.filter(emp => emp.bankName && emp.accountNo).length;
  const totalMissing = totalEligible - totalActive;

  const handleExportExcel = () => {
    if (filteredEmployees.length === 0) {
      return toast.error('No bank details available to export.');
    }
    try {
      const data = filteredEmployees.map(emp => ({
        'Employee Name': emp.name,
        'Nickname': emp.nickname || '—',
        'NIC Number': emp.nic || '—',
        'Branch Location': emp.branch || 'General',
        'Department': emp.department || 'Operations',
        'Mobile Contact': emp.phone || '—',
        'Bank Name': emp.bankName || 'Not Set',
        'Bank Branch': emp.bankBranch || 'Not Set',
        'Account Number': emp.accountNo || 'Not Set',
        'Account Holder Name': emp.accountHolderName || emp.name,
      }));

      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Employee Bank List');
      
      // Auto-fit columns dynamically for excellence
      const maxLens = Object.keys(data[0] || {}).map(key => {
        let maxLen = key.length;
        data.forEach(row => {
          const val = row[key as keyof typeof row] || '';
          maxLen = Math.max(maxLen, String(val).length);
        });
        return { wch: maxLen + 3 };
      });
      worksheet['!cols'] = maxLens;

      XLSX.writeFile(workbook, `Employee_Bank_Details_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success('Employee bank details list exported successfully');
    } catch (err) {
      console.error('Excel Export Error:', err);
      toast.error('Failed to export to Excel');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
        <p className="text-sm font-bold text-zinc-400">Loading bank details directory...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-zinc-900">Bank Details</h1>
          <p className="text-zinc-500 font-medium tracking-tight">Consolidated directory of all staff bank records for salary processing</p>
        </div>
        <button
          onClick={handleExportExcel}
          className="bg-purple-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-purple-700 transition-all shadow-lg shadow-purple-100 self-start md:self-auto"
        >
          <Download size={18} />
          Export Bank Directory
        </button>
      </div>

      {/* Stats Summary Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-center text-zinc-500">
            <CreditCard size={22} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Total Staff (Eligible)</p>
            <p className="text-2xl font-black text-zinc-900 mt-0.5">{totalEligible}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-green-50 border border-green-100 flex items-center justify-center text-green-500">
            <UserCheck size={22} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Active Bank Profiles</p>
            <p className="text-2xl font-black text-green-600 mt-0.5">{totalActive}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-500">
            <UserMinus size={22} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Missing Profiles</p>
            <p className="text-2xl font-black text-amber-500 mt-0.5">{totalMissing}</p>
          </div>
        </div>
      </div>

      {/* Filters Banner */}
      <div className="bg-white p-6 rounded-[2.5rem] border border-zinc-100 shadow-sm flex flex-col lg:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by name, nickname, bank name, or branch..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-zinc-50 border border-zinc-100 rounded-2xl text-sm focus:ring-2 focus:ring-purple-500 outline-none transition-all placeholder:text-zinc-400 font-medium"
          />
        </div>
        <div className="flex items-center gap-2 bg-zinc-50 border border-zinc-100 rounded-2xl px-4 py-1.5 w-full lg:w-auto">
          <Filter size={14} className="text-zinc-400" />
          <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Branch:</span>
          <select 
            value={filterBranch}
            onChange={(e) => setFilterBranch(e.target.value)}
            className="py-1.5 bg-transparent text-sm font-bold text-zinc-600 outline-none min-w-[140px]"
          >
            {branches.map(b => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Directory Grid */}
      <div className="bg-white rounded-[2.5rem] border border-zinc-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50/50 border-b border-zinc-100">
                <th className="px-8 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Employee</th>
                <th className="px-8 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">NIC / Contact</th>
                <th className="px-8 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Bank</th>
                <th className="px-8 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Branch Name</th>
                <th className="px-8 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Account Number</th>
                <th className="px-8 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Account Holder</th>
                <th className="px-8 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {filteredEmployees.map((emp) => {
                const hasBank = !!(emp.bankName || emp.accountNo);
                return (
                  <tr key={emp.uid} className="hover:bg-zinc-50/30 transition-colors">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-black text-xs border border-purple-100">
                          {emp.name.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="font-bold text-zinc-900 leading-tight">{emp.name}</p>
                            {emp.nickname && (
                              <span className="px-2 py-0.5 bg-zinc-100 rounded text-[9px] font-bold text-zinc-500">
                                {emp.nickname}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5">{emp.branch || 'General'} • {emp.department || 'Operations'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <p className="text-xs font-bold text-zinc-700">{emp.nic || '—'}</p>
                      <p className="text-[10px] font-bold text-zinc-400 mt-0.5">{emp.phone || 'No Contact'}</p>
                    </td>
                    <td className="px-8 py-5 text-sm font-bold text-zinc-700">
                      {hasBank ? emp.bankName : <span className="text-zinc-300 font-normal">Not added yet</span>}
                    </td>
                    <td className="px-8 py-5 text-sm font-semibold text-zinc-600">
                      {hasBank ? emp.bankBranch || '—' : <span className="text-zinc-300 font-normal">—</span>}
                    </td>
                    <td className="px-8 py-5 text-sm font-bold text-zinc-700 font-mono tracking-wider">
                      {hasBank ? (
                        <div className="flex items-center gap-2">
                          {emp.accountNo}
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText(emp.accountNo || '');
                              setCopiedId(emp.uid);
                              toast.success(`Copied account number for ${emp.name}`);
                              setTimeout(() => setCopiedId(null), 2000);
                            }}
                            className="text-zinc-400 hover:text-purple-600 p-1 rounded hover:bg-zinc-100 transition-colors"
                            title="Copy Account Number"
                          >
                            {copiedId === emp.uid ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                          </button>
                        </div>
                      ) : (
                        <span className="text-zinc-300 font-normal">—</span>
                      )}
                    </td>
                    <td className="px-8 py-5 text-sm font-semibold text-zinc-600">
                      {hasBank ? emp.accountHolderName || emp.name : <span className="text-zinc-300 font-normal">—</span>}
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="inline-flex">
                        {hasBank ? (
                          <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-green-100">
                            <Sparkles size={10} />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-zinc-50 text-zinc-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-zinc-100">
                            <AlertCircle size={10} />
                            Missing
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredEmployees.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-8 py-16 text-center text-zinc-400 font-medium">
                    No employees matching the criteria found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
