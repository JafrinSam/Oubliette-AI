import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Users, RefreshCw, X } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import api from '../lib/api';

export default function EditAccessModal({ isOpen, onClose, resource, type, onSuccess }) {
    if (!isOpen || !resource) return null;

    const [isShared, setIsShared] = useState(resource.isShared || false);
    const [sensitivity, setSensitivity] = useState(resource.sensitivity || 'RESTRICTED');
    const [departmentOwner, setDepartmentOwner] = useState(resource.departmentOwner || 'GENERAL');
    const [managementDepartment, setManagementDepartment] = useState(resource.managementDepartment || 'GENERAL');
    
    const [isSaving, setIsSaving] = useState(false);
    const toast = useToast();

    // Reset local state when resource changes
    useEffect(() => {
        if (resource) {
            setIsShared(resource.isShared || false);
            setSensitivity(resource.sensitivity || 'RESTRICTED');
            setDepartmentOwner(resource.departmentOwner || 'GENERAL');
            setManagementDepartment(resource.managementDepartment || 'GENERAL');
        }
    }, [resource]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const data = {
                isShared,
                sensitivity,
                departmentOwner,
                managementDepartment: managementDepartment === 'GENERAL' ? null : managementDepartment
            };
            
            // For type, ensure it's plural (dataset -> datasets)
            const endpoint = `/${type}s/${resource.id}/access`;
            
            const res = await api.patch(endpoint, data);
            
            toast.success("Access Updated", "Zero-Trust policy has been updated successfully.");
            if (onSuccess) {
                // Return updated resource from the server
                onSuccess(res.data[type] || res.data);
            }
            onClose();
        } catch (error) {
            console.error(error);
            toast.error("Update Failed", error.response?.data?.error || "Failed to update access rules.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-surface w-full max-w-lg rounded-3xl border border-border shadow-2xl overflow-hidden"
                >
                    <div className="p-6 border-b border-border flex justify-between items-center bg-background">
                        <div>
                            <h3 className="text-xl font-bold text-text-main flex items-center gap-2">
                                <Shield className="text-primary" /> Manage Resource Access
                            </h3>
                            <p className="text-xs text-text-muted mt-1 font-mono">{resource.name || resource.tag || resource.id}</p>
                        </div>
                        <button onClick={onClose} className="text-text-muted hover:text-error transition-colors p-2 rounded-xl hover:bg-surface text-sm">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="p-6 space-y-6">
                        {/* 1. Share Checkbox */}
                        <div className="flex items-center gap-2 p-3 bg-surface-hover rounded-xl border border-border">
                            <input 
                                type="checkbox" 
                                id="edit_shared_chk" 
                                checked={isShared} 
                                onChange={(e) => setIsShared(e.target.checked)} 
                                className="w-4 h-4 rounded text-primary focus:ring-primary bg-background border-border" 
                            />
                            <label htmlFor="edit_shared_chk" className="text-sm font-bold text-text-main cursor-pointer">
                                Make Available (Share based on Read Dept rules)
                            </label>
                        </div>

                        {/* 2. Controls Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-text-muted mb-2">Cryptographic Clearance Level</label>
                                <select 
                                    value={sensitivity} 
                                    onChange={(e) => setSensitivity(e.target.value)}
                                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-text-main font-bold focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                >
                                    <option value="UNCLASSIFIED">Unclassified</option>
                                    <option value="INTERNAL">Internal</option>
                                    <option value="RESTRICTED">Restricted</option>
                                    <option value="TOP_SECRET">Top Secret</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-text-muted mb-2 text-warning flex items-center gap-1">
                                    <Users size={12} /> Read Department
                                </label>
                                <select 
                                    value={departmentOwner} 
                                    onChange={(e) => setDepartmentOwner(e.target.value)}
                                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-warning font-bold focus:border-warning focus:ring-1 focus:ring-warning outline-none transition-all"
                                >
                                    <option value="GENERAL">General (All)</option>
                                    <option value="FINANCE">Finance</option>
                                    <option value="HEALTHCARE">Healthcare</option>
                                    <option value="NLP_RESEARCH">NLP Research</option>
                                </select>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-border">
                            <label className="block text-xs font-bold text-text-muted mb-2 text-primary flex items-center gap-1">
                                <Shield size={12} /> Management Team (Edit / Delete)
                            </label>
                            <p className="text-[10px] text-text-muted mb-3">If assigned, only ML_ADMIN and members of this department can edit or delete this resource.</p>
                            <select 
                                value={managementDepartment} 
                                onChange={(e) => setManagementDepartment(e.target.value)}
                                className="w-full bg-background border border-primary/30 rounded-xl px-4 py-2.5 text-sm text-primary font-bold focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                            >
                                <option value="GENERAL">None (Owner Default)</option>
                                <option value="FINANCE">Finance</option>
                                <option value="HEALTHCARE">Healthcare</option>
                                <option value="NLP_RESEARCH">NLP Research</option>
                            </select>
                        </div>
                    </div>

                    <div className="p-4 border-t border-border bg-background flex gap-3">
                        <button onClick={onClose} className="flex-1 py-3 text-text-muted hover:text-text-main font-bold transition-colors">
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="flex-1 py-3 bg-primary text-white rounded-xl font-bold tracking-wide hover:bg-primary/90 disabled:opacity-50 transition-all flex justify-center items-center gap-2"
                        >
                            {isSaving && <RefreshCw className="animate-spin" size={16} />}
                            {isSaving ? "Enforcing Rules..." : "Save Policies"}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
