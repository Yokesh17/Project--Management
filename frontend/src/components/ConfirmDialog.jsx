import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

const ConfirmDialog = ({
    isOpen,
    onClose,
    onConfirm,
    title = 'Confirm',
    message = 'Are you sure?',
    confirmText = 'Delete',
    cancelText = 'Cancel',
    variant = 'danger' // 'danger' | 'warning'
}) => {
    if (!isOpen) return null;

    const handleConfirm = () => {
        onConfirm();
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.1 }}
                    className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.1 }}
                        className="bg-slate-800 border border-slate-700 rounded-lg w-full max-w-xs shadow-2xl"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="p-4">
                            <div className="flex items-start gap-3">
                                <div className={`p-2 rounded-full ${variant === 'danger' ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400'}`}>
                                    <AlertTriangle size={16} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-sm font-semibold text-white">{title}</h3>
                                    <p className="text-xs text-slate-400 mt-1">{message}</p>
                                </div>
                                <button onClick={onClose} className="text-slate-500 hover:text-white transition">
                                    <X size={14} />
                                </button>
                            </div>
                        </div>
                        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-slate-700/50">
                            <button
                                onClick={onClose}
                                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white transition"
                            >
                                {cancelText}
                            </button>
                            <button
                                onClick={handleConfirm}
                                className={`px-3 py-1.5 text-xs font-medium rounded transition ${variant === 'danger'
                                    ? 'bg-red-600 hover:bg-red-500 text-white'
                                    : 'bg-amber-600 hover:bg-amber-500 text-white'
                                    }`}
                            >
                                {confirmText}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ConfirmDialog;
