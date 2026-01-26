import React, { useState } from 'react';
import { X, ArrowRight } from 'lucide-react';

const CreateStageModal = ({ onClose, onCreate }) => {
    const [name, setName] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (name.trim()) {
            onCreate(name);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 backdrop-blur-sm bg-black/20" onClick={onClose}>
            <div
                className="w-full max-w-sm bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-1 overflow-hidden transition-all transform scale-100"
                onClick={e => e.stopPropagation()}
            >
                <form onSubmit={handleSubmit} className="relative flex items-center">
                    <input
                        autoFocus
                        placeholder="New Stage Name..."
                        className="w-full bg-transparent text-white px-5 py-4 text-sm font-medium placeholder-slate-500 outline-none"
                        value={name}
                        onChange={e => setName(e.target.value)}
                    />
                    <button
                        type="submit"
                        disabled={!name.trim()}
                        className="absolute right-2 p-2 bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl transition-all disabled:opacity-0 disabled:translate-x-4"
                    >
                        <ArrowRight size={16} />
                    </button>
                    {!name.trim() && (
                        <button
                            type="button"
                            onClick={onClose}
                            className="absolute right-2 p-2 text-slate-500 hover:text-white transition-colors"
                        >
                            <X size={16} />
                        </button>
                    )}
                </form>
            </div>
        </div>
    );
};

export default CreateStageModal;
