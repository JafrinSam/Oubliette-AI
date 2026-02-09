import React, { useState, useEffect } from 'react';
import { X, Save, User, Mail, Lock, Shield, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '../../services/apiClient';
import ModalPortal from '../utils/ModalPortal'; // 👈 Import the Portal

const ROLES = [
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'admin', label: 'Admin' },
  { value: 'event_manager', label: 'Event Manager' },
  { value: 'user', label: 'Regular User' },
];

export default function UserModal({ isOpen, onClose, userData, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user',
    avatar: ''
  });

  useEffect(() => {
    if (isOpen) {
      if (userData) {
        setFormData({
          name: userData.name || '',
          email: userData.email || '',
          role: userData.role || 'user',
          password: '',
          avatar: userData.avatar || ''
        });
      } else {
        setFormData({ name: '', email: '', password: '', role: 'user', avatar: '' });
      }
    }
  }, [isOpen, userData]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (userData) {
        await apiClient.put(`/users/${userData._id}`, formData);
        toast.success("User updated successfully");
      } else {
        await apiClient.post('/users/staff', formData);
        toast.success("New staff member created");
      }
      onSuccess();
      onClose();
    } catch (error) {
      const msg = error.response?.data?.message || "Operation failed";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // 🚀 WRAP CONTENT IN PORTAL
  return (
    <ModalPortal>
      {/* Backdrop */}
      <div className="fixed inset-0 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
        
        {/* Modal Content */}
        <div className="w-full max-w-md bg-white dark:bg-[#111827] rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden transform transition-all scale-100 animate-in fade-in zoom-in-95 duration-200">
          
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-800">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {userData ? 'Edit Member' : 'Add New Member'}
            </h2>
            <button 
              onClick={onClose} 
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            
            {/* Name */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Full Name</label>
              <div className="relative group">
                <User size={16} className="absolute left-3 top-3.5 text-gray-400 group-focus-within:text-[var(--accent-color)]" />
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 focus:border-[var(--accent-color)] outline-none transition-all"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Email Address</label>
              <div className="relative group">
                <Mail size={16} className="absolute left-3 top-3.5 text-gray-400 group-focus-within:text-[var(--accent-color)]" />
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="john@example.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 focus:border-[var(--accent-color)] outline-none transition-all"
                />
              </div>
            </div>

            {/* Role Selection */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Access Role</label>
              <div className="relative group">
                <Shield size={16} className="absolute left-3 top-3.5 text-gray-400 group-focus-within:text-[var(--accent-color)]" />
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 focus:border-[var(--accent-color)] outline-none transition-all appearance-none"
                >
                  {ROLES.map(role => (
                    <option key={role.value} value={role.value}>{role.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {userData ? 'Reset Password (Optional)' : 'Temporary Password'}
              </label>
              <div className="relative group">
                <Lock size={16} className="absolute left-3 top-3.5 text-gray-400 group-focus-within:text-[var(--accent-color)]" />
                <input
                  type="password"
                  name="password"
                  required={!userData}
                  minLength={8}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder={userData ? "Leave empty to keep current" : "••••••••"}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 focus:border-[var(--accent-color)] outline-none transition-all"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 rounded-xl font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-[2] py-3 rounded-xl font-bold text-white bg-[var(--accent-color)] hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                {userData ? 'Save Changes' : 'Create Member'}
              </button>
            </div>

          </form>
        </div>
      </div>
    </ModalPortal>
  );
}