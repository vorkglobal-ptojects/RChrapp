import React, { useState, useRef, useEffect } from 'react';
import { 
  User, Mail, Shield, LogOut, Edit3,
  Phone, X, Camera, CreditCard, Award, MapPin
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { cn, formatDate } from '../lib/utils';
import * as userService from '../services/userService';
import { toast } from 'sonner';

export default function Profile() {
  const { user, logout, updateUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    nickname: '',
    nic: '',
    email: '',
    phone: '',
    photoUrl: '',
    bankName: '',
    bankBranch: '',
    accountNo: '',
    accountHolderName: '',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Initialize form data when entering edit mode
  useEffect(() => {
    if (isEditing && user) {
      const nameParts = user.name.split(' ');
      setFormData({
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || '',
        nickname: user.nickname || '',
        nic: user.nic || '',
        email: user.email || '',
        phone: user.phone || '',
        photoUrl: user.photoUrl || '',
        bankName: user.bankName || '',
        bankBranch: user.bankBranch || '',
        accountNo: user.accountNo || '',
        accountHolderName: user.accountHolderName || user.name || '',
      });
    }
  }, [isEditing, user]);

  if (!user) return null;

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, photoUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    const fullName = `${formData.firstName} ${formData.lastName}`.trim();
    if (!fullName) {
      return toast.error('First Name and Last Name are required.');
    }

    // If eligible for bank details, validate if any field is filled out
    const isEligibleBank = user.role === 'employee' || user.role === 'hr';
    if (isEligibleBank && (formData.bankName.trim() || formData.accountNo.trim())) {
      if (!formData.bankName.trim() || !formData.accountNo.trim()) {
        return toast.error('Both Bank Name and Account Number are required if updating bank details.');
      }
    }
    
    try {
      toast.loading('Saving profile changes...');
      let finalPhotoUrl = formData.photoUrl || user.photoUrl || '';

      // 1. Upload photo if selected
      if (selectedFile && user.uid) {
        finalPhotoUrl = await userService.uploadAvatar(user.uid, selectedFile);
      }

      // 2. Prepare payload
      const updatedUser = {
        ...user,
        name: fullName,
        nickname: formData.nickname.trim(),
        nic: formData.nic.trim(),
        phone: formData.phone.trim(),
        photoUrl: finalPhotoUrl,
        bankName: isEligibleBank ? formData.bankName.trim() : user.bankName,
        bankBranch: isEligibleBank ? formData.bankBranch.trim() : user.bankBranch,
        accountNo: isEligibleBank ? formData.accountNo.trim() : user.accountNo,
        accountHolderName: isEligibleBank ? (formData.accountHolderName.trim() || fullName) : user.accountHolderName,
      };
      
      await userService.saveEmployee(updatedUser);
      updateUser(updatedUser);
      setIsEditing(false);
      setSelectedFile(null);
      toast.dismiss();
      toast.success('Profile details updated successfully!');
    } catch (err) {
      console.error('Profile Update Error:', err);
      toast.dismiss();
      toast.error('Failed to save profile changes');
    }
  };

  const statusColors = {
    'Available': 'bg-green-500',
    'Busy': 'bg-red-500',
    'On Leave': 'bg-amber-500',
    'Remote': 'bg-blue-500',
    'Meeting': 'bg-purple-500',
  };

  const nameParts = user.name.split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  return (
    <div className="space-y-8 pb-12 relative animate-in fade-in duration-200">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-zinc-900">My Profile</h1>
          <p className="text-zinc-500 font-medium tracking-tight">Manage your professional identity and workspace settings</p>
        </div>
        <button 
          onClick={() => setIsEditing(true)}
          className="flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-2xl font-bold hover:bg-orange-600 transition-all shadow-lg shadow-orange-100"
        >
          <Edit3 size={18} />
          Edit Profile
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Staff Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] border border-zinc-100 shadow-sm text-center">
            <div className="relative inline-block mb-6">
              <div className="w-32 h-32 rounded-[2.5rem] bg-zinc-50 border-4 border-white shadow-xl overflow-hidden flex items-center justify-center">
                {user.photoUrl ? (
                  <img src={user.photoUrl} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl font-black text-zinc-300 uppercase">{user.name.charAt(0)}</span>
                )}
              </div>
              <div className={cn(
                "absolute bottom-2 right-2 w-6 h-6 rounded-full border-4 border-white shadow-sm",
                statusColors[user.status as keyof typeof statusColors] || 'bg-zinc-400'
              )} />
            </div>
            
            <h2 className="text-2xl font-black text-zinc-900 leading-tight">{user.name}</h2>
            {user.nickname && (
              <p className="text-sm text-zinc-400 font-bold uppercase tracking-widest mt-1">"{user.nickname}"</p>
            )}

            <div className="flex items-center justify-center gap-2 my-6">
              <span className="px-3 py-1 bg-zinc-100 rounded-full text-[10px] font-bold text-zinc-500 uppercase tracking-widest border border-zinc-200">
                {user.status}
              </span>
            </div>
            
            <div className="space-y-3">
              <button className="w-full py-4 bg-zinc-50 text-zinc-600 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-zinc-100 transition-all border border-zinc-100">
                <Shield size={18} />
                Security Settings
              </button>
              <button 
                onClick={logout}
                className="w-full py-4 bg-red-50 text-red-600 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-red-100 transition-all border border-red-50"
              >
                <LogOut size={18} />
                Sign Out
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Information Grid */}
        <div className="lg:col-span-2 space-y-8">
          {/* Personal & Identity Details Card */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-zinc-100 shadow-sm min-h-[400px]">
            <h3 className="text-xl font-black text-zinc-900 mb-8 flex items-center gap-2">
              <User size={22} className="text-blue-500" />
              Identity Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">First Name</label>
                <div className="px-5 py-4 bg-zinc-50/50 rounded-2xl text-sm font-bold text-zinc-700 border border-zinc-100">
                  {firstName || '—'}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Last Name</label>
                <div className="px-5 py-4 bg-zinc-50/50 rounded-2xl text-sm font-bold text-zinc-700 border border-zinc-100">
                  {lastName || '—'}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Nick Name</label>
                <div className="px-5 py-4 bg-zinc-50/50 rounded-2xl text-sm font-bold text-zinc-700 border border-zinc-100">
                  {user.nickname || '—'}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">NIC Number</label>
                <div className="px-5 py-4 bg-zinc-50/50 rounded-2xl text-sm font-bold text-zinc-700 border border-zinc-100 font-mono">
                  {user.nic || '—'}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Email Address</label>
                <div className="px-5 py-4 bg-zinc-50/50 rounded-2xl text-sm font-bold text-zinc-700 border border-zinc-100">
                  {user.email}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Mobile Contact</label>
                <div className="px-5 py-4 bg-zinc-50/50 rounded-2xl text-sm font-bold text-zinc-700 border border-zinc-100">
                  {user.phone || '—'}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Access Role</label>
                <div className="px-5 py-4 bg-zinc-50/50 rounded-2xl text-sm font-bold text-blue-600 border border-blue-50 capitalize flex items-center gap-1.5">
                  <Award size={14} />
                  {user.role}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Workspace Allocation</label>
                <div className="px-5 py-4 bg-zinc-50/50 rounded-2xl text-sm font-bold text-zinc-700 border border-zinc-100 flex items-center gap-1.5">
                  <MapPin size={14} className="text-zinc-400" />
                  {user.branch || 'Colombo'} • {user.department || 'Operations'}
                </div>
              </div>
            </div>
          </div>

          {/* Bank Account Details Card (Only for Employees & HR) */}
          {(user.role === 'employee' || user.role === 'hr') && (
            <div className="bg-white p-8 rounded-[2.5rem] border border-zinc-100 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black text-zinc-900 flex items-center gap-2">
                  <CreditCard size={22} className="text-purple-500" />
                  Bank Account Details
                </h3>
                <span className="text-[9px] font-black tracking-widest uppercase px-3 py-1 bg-purple-50 text-purple-600 border border-purple-100 rounded-full">
                  Verified Acc
                </span>
              </div>

              {user.bankName || user.accountNo ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Bank Name</label>
                    <div className="px-5 py-4 bg-zinc-50/50 rounded-2xl text-sm font-bold text-zinc-700 border border-zinc-100">
                      {user.bankName}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Branch Name</label>
                    <div className="px-5 py-4 bg-zinc-50/50 rounded-2xl text-sm font-bold text-zinc-700 border border-zinc-100">
                      {user.bankBranch || '—'}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Account Number</label>
                    <div className="px-5 py-4 bg-zinc-50/50 rounded-2xl text-sm font-bold text-zinc-700 border border-zinc-100 font-mono tracking-wider">
                      {user.accountNo}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Account Holder Name</label>
                    <div className="px-5 py-4 bg-zinc-50/50 rounded-2xl text-sm font-bold text-zinc-700 border border-zinc-100">
                      {user.accountHolderName || user.name}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center bg-zinc-50/50 border border-dashed border-zinc-200 rounded-[2rem] flex flex-col items-center justify-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-400">
                    <CreditCard size={24} />
                  </div>
                  <div>
                    <p className="font-bold text-zinc-700 text-sm">No bank account details added</p>
                    <p className="text-xs text-zinc-400 mt-0.5">Please update your profile to configure your bank account details.</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 🚀 Single, Unified Edit Profile Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 relative my-8">
            {/* Modal Header */}
            <div className="p-8 pb-4 flex items-start justify-between border-b border-zinc-100">
              <div>
                <h2 className="text-xl font-black text-zinc-900 flex items-center gap-2">
                  <Edit3 size={20} className="text-orange-500" />
                  Edit Profile Information
                </h2>
                <p className="text-xs text-zinc-500 font-medium mt-1">Modify your identity and bank details. Click save to submit.</p>
              </div>
              <button onClick={() => setIsEditing(false)} className="p-2 hover:bg-zinc-50 rounded-xl transition-all text-zinc-400">
                <X size={20} />
              </button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto p-8 space-y-8">
              {/* Avatar Picker Section */}
              <div className="flex flex-col items-center pb-4">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-[1.8rem] bg-orange-50 border-2 border-dashed border-orange-200 flex items-center justify-center overflow-hidden">
                    {formData.photoUrl ? (
                      <img src={formData.photoUrl} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-3xl font-black text-orange-600 uppercase">
                        {formData.firstName.charAt(0)}{formData.lastName ? formData.lastName.charAt(0) : '?'}
                      </span>
                    )}
                  </div>
                  <button 
                    onClick={handlePhotoClick}
                    className="absolute bottom-0 right-0 p-2 bg-orange-500 text-white rounded-full shadow-lg hover:bg-orange-600 transition-all border-4 border-white"
                  >
                    <Camera size={14} />
                  </button>
                </div>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-4">Upload avatar image</p>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
              </div>

              {/* SECTION 1: Personal Details */}
              <div className="space-y-6">
                <h4 className="text-xs font-black uppercase text-zinc-400 tracking-widest border-b border-zinc-100 pb-2 flex items-center gap-2">
                  <User size={14} className="text-blue-500" />
                  Personal Information
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-700 uppercase tracking-widest ml-1">First Name *</label>
                    <input 
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                      className="w-full px-5 py-3.5 bg-zinc-50 rounded-2xl text-sm font-bold text-zinc-700 border border-zinc-100 focus:ring-2 focus:ring-orange-500 outline-none transition-all placeholder:text-zinc-300"
                      placeholder="e.g. John"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-700 uppercase tracking-widest ml-1">Last Name *</label>
                    <input 
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                      className="w-full px-5 py-3.5 bg-zinc-50 rounded-2xl text-sm font-bold text-zinc-700 border border-zinc-100 focus:ring-2 focus:ring-orange-500 outline-none transition-all placeholder:text-zinc-300"
                      placeholder="e.g. Doe"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-700 uppercase tracking-widest ml-1">Nick Name</label>
                    <input 
                      type="text"
                      value={formData.nickname}
                      onChange={(e) => setFormData(prev => ({ ...prev, nickname: e.target.value }))}
                      className="w-full px-5 py-3.5 bg-zinc-50 rounded-2xl text-sm font-bold text-zinc-700 border border-zinc-100 focus:ring-2 focus:ring-orange-500 outline-none transition-all placeholder:text-zinc-300"
                      placeholder="e.g. Johnny"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-700 uppercase tracking-widest ml-1">NIC Number</label>
                    <input 
                      type="text"
                      value={formData.nic}
                      onChange={(e) => setFormData(prev => ({ ...prev, nic: e.target.value }))}
                      className="w-full px-5 py-3.5 bg-zinc-50 rounded-2xl text-sm font-bold text-zinc-700 border border-zinc-100 focus:ring-2 focus:ring-orange-500 outline-none transition-all placeholder:text-zinc-300 font-mono"
                      placeholder="e.g. 199512345V"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-700 uppercase tracking-widest ml-1">Email Address (Read Only)</label>
                    <input 
                      type="email"
                      value={formData.email}
                      disabled
                      className="w-full px-5 py-3.5 bg-zinc-100 rounded-2xl text-sm font-bold text-zinc-400 border border-zinc-200 cursor-not-allowed"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-700 uppercase tracking-widest ml-1">Mobile Contact</label>
                    <input 
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-5 py-3.5 bg-zinc-50 rounded-2xl text-sm font-bold text-zinc-700 border border-zinc-100 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                      placeholder="e.g. 077 123 4567"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: Bank Details (Only for Employees & HR) */}
              {(user.role === 'employee' || user.role === 'hr') && (
                <div className="space-y-6 pt-4">
                  <h4 className="text-xs font-black uppercase text-zinc-400 tracking-widest border-b border-zinc-100 pb-2 flex items-center gap-2">
                    <CreditCard size={14} className="text-purple-500" />
                    Bank Account Details
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-zinc-700 uppercase tracking-widest ml-1">Bank Name</label>
                      <input 
                        type="text"
                        value={formData.bankName}
                        onChange={(e) => setFormData(prev => ({ ...prev, bankName: e.target.value }))}
                        className="w-full px-5 py-3.5 bg-zinc-50 rounded-2xl text-sm font-bold text-zinc-700 border border-zinc-100 focus:ring-2 focus:ring-purple-500 outline-none transition-all placeholder:text-zinc-300"
                        placeholder="e.g. Commercial Bank, BOC"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-zinc-700 uppercase tracking-widest ml-1">Branch Name</label>
                      <input 
                        type="text"
                        value={formData.bankBranch}
                        onChange={(e) => setFormData(prev => ({ ...prev, bankBranch: e.target.value }))}
                        className="w-full px-5 py-3.5 bg-zinc-50 rounded-2xl text-sm font-bold text-zinc-700 border border-zinc-100 focus:ring-2 focus:ring-purple-500 outline-none transition-all placeholder:text-zinc-300"
                        placeholder="e.g. Borella, Kollupitiya"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-zinc-700 uppercase tracking-widest ml-1">Account Number</label>
                      <input 
                        type="text"
                        value={formData.accountNo}
                        onChange={(e) => setFormData(prev => ({ ...prev, accountNo: e.target.value }))}
                        className="w-full px-5 py-3.5 bg-zinc-50 rounded-2xl text-sm font-bold text-zinc-700 border border-zinc-100 focus:ring-2 focus:ring-purple-500 outline-none transition-all placeholder:text-zinc-300 font-mono"
                        placeholder="e.g. 1040082341"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-zinc-700 uppercase tracking-widest ml-1">Account Holder Name</label>
                      <input 
                        type="text"
                        value={formData.accountHolderName}
                        onChange={(e) => setFormData(prev => ({ ...prev, accountHolderName: e.target.value }))}
                        className="w-full px-5 py-3.5 bg-zinc-50 rounded-2xl text-sm font-bold text-zinc-700 border border-zinc-100 focus:ring-2 focus:ring-purple-500 outline-none transition-all placeholder:text-zinc-300"
                        placeholder="e.g. J. A. D. S. Perera"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="p-8 border-t border-zinc-100 flex items-center justify-end gap-3 bg-zinc-50/50">
              <button 
                onClick={() => setIsEditing(false)}
                className="px-6 py-3.5 text-sm font-bold text-zinc-500 hover:text-zinc-900 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleSave}
                className="px-8 py-3.5 bg-orange-500 text-white rounded-2xl font-bold hover:bg-orange-600 transition-all shadow-lg shadow-orange-100 active:scale-95"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
