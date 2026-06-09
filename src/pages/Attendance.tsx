import React, { useState, useEffect } from 'react';
import { 
  UserCheck, Timer, Search, Filter, Download, Trash2,
  Clock, ArrowUpRight, ArrowDownRight, Calendar
} from 'lucide-react';
import { utils, writeFile } from 'xlsx';
import { AttendanceRecord, UserProfile, AttendanceTicket } from '../types';
import * as userService from '../services/userService';
import * as attendanceService from '../services/attendanceService';
import * as attendanceTicketService from '../services/attendanceTicketService';
import { useAuth } from '../hooks/useAuth';
import { cn, formatDate } from '../lib/utils';
import { motion } from 'motion/react';
import { toast } from 'sonner';

export default function Attendance() {
  const { user } = useAuth();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [employees, setEmployees] = useState<UserProfile[]>([]);
  const [tickets, setTickets] = useState<AttendanceTicket[]>([]);
  const [activeTab, setActiveTab] = useState<'Logs' | 'Tickets'>('Logs');
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [ticketForm, setTicketForm] = useState({
    date: new Date().toISOString().split('T')[0],
    type: 'Check-In' as 'Check-In' | 'Check-Out' | 'Both',
    requestedTime: '',
    requestedCheckOut: '',
    reason: ''
  });
  const [submittingTicket, setSubmittingTicket] = useState(false);
  const [search, setSearch] = useState('');
  const [filterBranch, setFilterBranch] = useState('All');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 10000); // Update every 10s for better responsiveness
    return () => clearInterval(timer);
  }, []);

  const todayStr = new Date().toISOString().split('T')[0];
  const activeRecord = records.find(r => r.userId === user?.uid && r.date === todayStr && !r.checkOut);
  
  let checkoutLocked = false;
  let remainingMinutes = 0;
  
  if (activeRecord) {
    const checkInTime = new Date(activeRecord.checkIn).getTime();
    const elapsedMs = currentTime.getTime() - checkInTime;
    const lockDurationMs = 60 * 60 * 1000;
    
    if (elapsedMs < lockDurationMs) {
      checkoutLocked = true;
      remainingMinutes = Math.ceil((lockDurationMs - elapsedMs) / (1000 * 60));
    }
  }

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const isManagement = user.role === 'hr' || user.role === 'owner' || user.role === 'super';
      const [empData, attData, ticketData] = await Promise.all([
        userService.getEmployees(),
        attendanceService.getAttendance(isManagement ? undefined : user.uid),
        attendanceTicketService.getTickets(isManagement ? undefined : user.uid)
      ]);
      setEmployees(empData);
      setRecords(attData);
      setTickets(ticketData);
    } catch (err) {
      console.error('Error loading attendance data:', err);
      toast.error('Failed to sync attendance');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.uid, user?.role]);

  const branches = ['All', ...new Set(employees.map(e => e.branch))];

  const filteredRecords = records.filter(r => {
    const emp = employees.find(e => e.uid === r.userId);
    const matchesSearch = emp ? emp.name.toLowerCase().includes(search.toLowerCase()) : true;
    const matchesBranch = filterBranch === 'All' || (emp ? emp.branch === filterBranch : true);
    const matchesDate = !selectedDate || r.date === selectedDate;
    return matchesSearch && matchesBranch && matchesDate;
  }).sort((a, b) => {
    const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
    if (dateDiff !== 0) return dateDiff;
    
    const empA = employees.find(e => e.uid === a.userId);
    const empB = employees.find(e => e.uid === b.userId);
    if (!empA || !empB) return 0;
    
    const getScore = (p: UserProfile) => {
      return p.sortOrder ?? 999;
    };
    return getScore(empA) - getScore(empB);
  });

  const getEmpName = (uid: string) => employees.find(e => e.uid === uid)?.name || 'Unknown';

  const handleExport = () => {
    if (filteredRecords.length === 0) {
      toast.error('No records to export');
      return;
    }

    const exportData = filteredRecords.map(record => {
      const emp = employees.find(e => e.uid === record.userId);
      const checkInDate = new Date(record.checkIn);
      const checkOutDate = record.checkOut ? new Date(record.checkOut) : null;
      
      let workHours = 'N/A';
      if (checkOutDate) {
        const diff = (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60);
        workHours = diff.toFixed(2);
      }

      return {
        'Employee Name': emp?.name || 'Unknown',
        'Branch': emp?.branch || 'N/A',
        'Date': record.date,
        'Check-In': checkInDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        'Check-Out': checkOutDate ? checkOutDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--',
        'Is Late (After 09:10 AM)': record.isLate ? 'Yes' : 'No',
        'Is Early Out (Before 05:30 PM)': record.isEarlyOut ? 'Yes' : 'No',
        'Status': record.checkOut ? 'Completed' : 'Active',
        'Work Hours': workHours
      };
    });

    const ws = utils.json_to_sheet(exportData);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Attendance Log');
    
    // Auto-size columns for better readability
    const max_width = exportData.reduce((w, r) => Math.max(w, r['Employee Name'].length), 10);
    ws['!cols'] = [{ wch: max_width + 5 }, { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 8 }, { wch: 12 }, { wch: 10 }, { wch: 12 }];

    writeFile(wb, `HR_Pulse_Attendance_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Attendance log exported successfully!');
  };

  const handleTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmittingTicket(true);
    try {
      let reqTime = undefined;
      let reqCheckOut = undefined;
      
      if (ticketForm.type === 'Check-In' || ticketForm.type === 'Both') {
        reqTime = new Date(`${ticketForm.date}T${ticketForm.requestedTime}:00+05:30`).toISOString();
      }
      if (ticketForm.type === 'Check-Out' || ticketForm.type === 'Both') {
        reqCheckOut = new Date(`${ticketForm.date}T${ticketForm.requestedCheckOut}:00+05:30`).toISOString();
      }

      await attendanceTicketService.createTicket({
        userId: user.uid,
        date: ticketForm.date,
        type: ticketForm.type,
        requestedTime: reqTime,
        requestedCheckOut: reqCheckOut,
        reason: ticketForm.reason
      });
      toast.success('Ticket submitted successfully');
      setShowTicketModal(false);
      loadData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to submit ticket');
    } finally {
      setSubmittingTicket(false);
    }
  };

  const handleTicketStatus = async (ticketId: string, status: 'Approved' | 'Rejected') => {
    if (!user) return;
    try {
      await attendanceTicketService.updateTicketStatus(ticketId, status, user.uid);
      toast.success(`Ticket ${status.toLowerCase()}`);
      loadData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to update ticket');
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-zinc-900">Attendance Log</h1>
          <p className="text-zinc-500 font-medium mb-3">Track daily work hours and shifts</p>
          <div className="inline-flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-bold bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2">
            <div className="flex items-center gap-1.5">
              <Clock size={14} className="text-zinc-400" />
              <span className="text-zinc-500">Standard Shift:</span>
              <span className="text-zinc-900">08:30 AM - 05:30 PM</span>
            </div>
            <div className="w-px h-3 bg-zinc-300 hidden sm:block"></div>
            <div className="flex items-center gap-1.5">
              <span className="text-red-500">Late In:</span>
              <span className="text-zinc-900">After 09:10 AM</span>
            </div>
            <div className="w-px h-3 bg-zinc-300 hidden sm:block"></div>
            <div className="flex items-center gap-1.5">
              <span className="text-amber-500">Early Out:</span>
              <span className="text-zinc-900">Before 05:30 PM</span>
            </div>
          </div>
        </div>
        <div className="bg-zinc-100 p-1 rounded-2xl flex w-full md:w-auto mt-4 md:mt-0">
          <button
            onClick={() => setActiveTab('Logs')}
            className={cn("flex-1 md:flex-none px-6 py-2.5 rounded-xl text-sm font-bold transition-all", activeTab === 'Logs' ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700")}
          >
            Logs
          </button>
          <button
            onClick={() => setActiveTab('Tickets')}
            className={cn("flex-1 md:flex-none px-6 py-2.5 rounded-xl text-sm font-bold transition-all", activeTab === 'Tickets' ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700")}
          >
            Requests
          </button>
        </div>
      </div>

      {activeTab === 'Logs' ? (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-xl font-bold text-zinc-900 hidden sm:block">Today's Activity</h2>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full sm:w-auto">
              {(user?.role === 'employee' || user?.role === 'hr') && (
            <div className="flex gap-2">
              <button 
                onClick={async () => {
                  try {
                    await attendanceService.checkIn(user.uid);
                    toast.success('Checked in!');
                    loadData();
                  } catch (err) {
                    toast.error('Failed to check in or already checked in today');
                  }
                }}
                className="bg-orange-500 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-orange-600 transition-all shadow-lg shadow-orange-100"
              >
                <ArrowUpRight size={18} />
                Check In
              </button>
              <button 
                disabled={checkoutLocked}
                onClick={async () => {
                  if (checkoutLocked) return;
                  try {
                    await attendanceService.checkOut(user.uid);
                    toast.success('Checked out!');
                    loadData();
                  } catch (err) {
                    toast.error('No active shift found');
                  }
                }}
                className={cn(
                  "px-6 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all shadow-lg",
                  checkoutLocked 
                    ? "bg-zinc-100 text-zinc-400 cursor-not-allowed shadow-none border border-zinc-200" 
                    : "bg-zinc-900 text-white hover:bg-zinc-800"
                )}
              >
                <ArrowDownRight size={18} />
                {checkoutLocked ? `Locked (${remainingMinutes}m)` : 'Check Out'}
              </button>
            </div>
          )}
          <button 
            onClick={handleExport}
            className="bg-white border border-zinc-200 text-zinc-600 px-4 py-3 w-full sm:w-auto justify-center rounded-2xl font-bold flex items-center gap-2 hover:bg-zinc-50 transition-all"
          >
            <Download size={18} />
            Export Logs
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600">
              <UserCheck size={18} />
            </div>
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Total Logs</span>
          </div>
          <p className="text-2xl font-black text-zinc-900">{filteredRecords.length}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center text-red-600">
              <Clock size={18} />
            </div>
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Late Check-ins</span>
          </div>
          <p className="text-2xl font-black text-zinc-900">{filteredRecords.filter(r => r.isLate).length}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center text-green-600">
              <Timer size={18} />
            </div>
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Completed Shifts</span>
          </div>
          <p className="text-2xl font-black text-zinc-900">{filteredRecords.filter(r => r.checkOut).length}</p>
        </div>
      </div>
          {/* Filters (Only for Admin/HR) */}
          {(user?.role !== 'employee') && (
        <div className="bg-white p-4 rounded-4xl border border-zinc-100 shadow-sm flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by employee name..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-zinc-50 border border-zinc-100 rounded-2xl text-sm focus:ring-2 focus:ring-orange-500 outline-none transition-all"
            />
          </div>
          <select 
            value={filterBranch}
            onChange={(e) => setFilterBranch(e.target.value)}
            className="px-4 py-3 bg-zinc-50 border border-zinc-100 rounded-2xl text-sm font-bold text-zinc-600 outline-none focus:ring-2 focus:ring-orange-500"
          >
            {branches.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
          <div className="relative">
            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" size={18} />
            <input 
              type="date" 
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="pl-12 pr-4 py-3 bg-zinc-50 border border-zinc-100 rounded-2xl text-sm font-bold text-zinc-600 outline-none focus:ring-2 focus:ring-orange-500"
            />
            {selectedDate && (
              <button 
                onClick={() => setSelectedDate('')}
                className="ml-2 text-xs font-bold text-zinc-400 hover:text-red-500 transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}

      {/* Attendance Table */}
      <div className="bg-white rounded-4xl border border-zinc-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50/50">
                <th className="px-8 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Employee</th>
                <th className="px-8 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Date</th>
                <th className="px-8 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Check In</th>
                <th className="px-8 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Check Out</th>
                <th className="px-8 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {filteredRecords.map((record) => (
                <tr key={record.id} className="hover:bg-zinc-50/30 transition-colors">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-500 font-black text-xs">
                        {getEmpName(record.userId).charAt(0)}
                      </div>
                      <span className="font-bold text-zinc-900">{getEmpName(record.userId)}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-2 text-sm font-bold text-zinc-700">
                      <Calendar size={14} className="text-zinc-400" />
                      {formatDate(record.date)}
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-2">
                      <ArrowUpRight size={14} className={record.isLate ? "text-red-500" : "text-green-500"} />
                      <span className={cn("text-sm font-black", record.isLate ? "text-red-600" : "text-zinc-900")}>
                        {new Date(record.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {record.isLate && <span className="text-[8px] font-black uppercase bg-red-50 text-red-600 px-1.5 py-0.5 rounded">Late</span>}
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-2">
                      <ArrowDownRight size={14} className={record.isEarlyOut ? "text-amber-500" : "text-blue-500"} />
                      <span className="text-sm font-black text-zinc-900">
                        {record.checkOut ? new Date(record.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                      </span>
                      {record.isEarlyOut && <span className="text-[8px] font-black uppercase bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded">Early</span>}
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                      record.checkOut ? "bg-green-50 text-green-700 border-green-100" : "bg-amber-50 text-amber-700 border-amber-100"
                    )}>
                      {record.checkOut ? 'Completed' : 'Active'}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white p-4 rounded-4xl border border-zinc-100 shadow-sm">
            <div>
              <h2 className="text-xl font-bold text-zinc-900 ml-4">Attendance Requests</h2>
              <p className="text-sm text-zinc-500 ml-4">Manage missed check-ins and check-outs</p>
            </div>
            {(user?.role === 'employee' || user?.role === 'hr') && (
              <button 
                onClick={() => setShowTicketModal(true)}
                className="bg-zinc-900 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-zinc-800 transition-all"
              >
                New Request
              </button>
            )}
          </div>

          <div className="bg-white rounded-4xl border border-zinc-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-50/50">
                    <th className="px-8 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Employee</th>
                    <th className="px-8 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Details</th>
                    <th className="px-8 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Reason</th>
                    <th className="px-8 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Status</th>
                    <th className="px-8 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50">
                  {tickets.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-8 py-8 text-center text-zinc-400 text-sm font-bold">No requests found.</td>
                    </tr>
                  ) : tickets.map((ticket) => (
                    <tr key={ticket.id} className="hover:bg-zinc-50/30 transition-colors">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-500 font-black text-xs">
                            {(ticket.user?.name || getEmpName(ticket.userId)).charAt(0)}
                          </div>
                          <span className="font-bold text-zinc-900">{ticket.user?.name || getEmpName(ticket.userId)}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-bold text-zinc-900">{formatDate(ticket.date)}</span>
                          <span className="text-xs font-bold text-orange-600 bg-orange-50 w-fit px-2 py-0.5 rounded-full">{ticket.type}</span>
                          <div className="text-xs text-zinc-500 mt-1">
                            {(ticket.type === 'Check-In' || ticket.type === 'Both') && (
                              <div>In: {ticket.requestedTime ? new Date(ticket.requestedTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</div>
                            )}
                            {(ticket.type === 'Check-Out' || ticket.type === 'Both') && (
                              <div>Out: {ticket.requestedCheckOut ? new Date(ticket.requestedCheckOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5 max-w-[200px]">
                        <p className="text-sm text-zinc-600 truncate">{ticket.reason}</p>
                      </td>
                      <td className="px-8 py-5">
                        <span className={cn(
                          "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                          ticket.status === 'Approved' ? "bg-green-50 text-green-700 border-green-100" :
                          ticket.status === 'Rejected' ? "bg-red-50 text-red-700 border-red-100" :
                          "bg-amber-50 text-amber-700 border-amber-100"
                        )}>
                          {ticket.status}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        {(user?.role === 'super' || user?.role === 'owner' || user?.role === 'hr') && ticket.status === 'Pending' && (
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => handleTicketStatus(ticket.id!, 'Approved')}
                              className="text-xs font-bold px-3 py-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
                            >
                              Approve
                            </button>
                            <button 
                              onClick={() => handleTicketStatus(ticket.id!, 'Rejected')}
                              className="text-xs font-bold px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Ticket Modal */}
      {showTicketModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden"
          >
            <div className="p-6 border-b border-zinc-100">
              <h3 className="text-xl font-black text-zinc-900">Request Attendance Fix</h3>
              <p className="text-sm text-zinc-500 mt-1">Submit a request to correct your check-in or out time.</p>
            </div>
            
            <form onSubmit={handleTicketSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Date</label>
                <input 
                  type="date" 
                  required
                  value={ticketForm.date}
                  max={new Date().toISOString().split('T')[0]}
                  onChange={e => setTicketForm({...ticketForm, date: e.target.value})}
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-bold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Missing Action</label>
                <select 
                  value={ticketForm.type}
                  onChange={e => setTicketForm({...ticketForm, type: e.target.value as any})}
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-bold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="Check-In">Missed Check-In</option>
                  <option value="Check-Out">Missed Check-Out</option>
                  <option value="Both">Missed Both</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {(ticketForm.type === 'Check-In' || ticketForm.type === 'Both') && (
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Check-In Time</label>
                    <input 
                      type="time" 
                      required
                      value={ticketForm.requestedTime}
                      onChange={e => setTicketForm({...ticketForm, requestedTime: e.target.value})}
                      className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-bold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                )}
                
                {(ticketForm.type === 'Check-Out' || ticketForm.type === 'Both') && (
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Check-Out Time</label>
                    <input 
                      type="time" 
                      required
                      value={ticketForm.requestedCheckOut}
                      onChange={e => setTicketForm({...ticketForm, requestedCheckOut: e.target.value})}
                      className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-bold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Reason</label>
                <textarea 
                  required
                  rows={3}
                  value={ticketForm.reason}
                  onChange={e => setTicketForm({...ticketForm, reason: e.target.value})}
                  placeholder="Explain why you missed the check-in/out..."
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium text-zinc-900 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowTicketModal(false)}
                  className="px-5 py-2.5 text-sm font-bold text-zinc-500 hover:text-zinc-700 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={submittingTicket}
                  className="px-5 py-2.5 bg-zinc-900 text-white text-sm font-bold rounded-xl hover:bg-zinc-800 transition-all disabled:opacity-50"
                >
                  {submittingTicket ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
