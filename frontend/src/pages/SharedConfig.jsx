import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../utils/api';
import { FileCode, Copy, Check } from 'lucide-react';

const SharedConfig = () => {
    const { token } = useParams();
    const [config, setConfig] = useState(null);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const res = await api.get(`/shared/${token}`);
                setConfig(res.data);
            } catch (err) {
                setError('Config not found or no longer shared.');
            }
        };
        fetchConfig();
    }, [token]);

    const copyToClipboard = () => {
        navigator.clipboard.writeText(config.content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (error) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="text-center">
                    <FileCode size={24} className="text-slate-600 mx-auto mb-2" />
                    <p className="text-sm text-slate-400">{error}</p>
                </div>
            </div>
        );
    }

    if (!config) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <p className="text-xs text-slate-500">Loading...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-900 p-4">
            <div className="max-w-2xl mx-auto">
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50">
                        <div className="flex items-center gap-2">
                            <FileCode size={16} className="text-indigo-400" />
                            <span className="text-sm font-medium text-white">{config.name}</span>
                        </div>
                        <button
                            onClick={copyToClipboard}
                            className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition"
                        >
                            {copied ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy</>}
                        </button>
                    </div>
                    <pre className="p-4 text-xs font-mono text-green-400 overflow-x-auto whitespace-pre-wrap">
                        {config.content}
                    </pre>
                    <div className="px-4 py-2 border-t border-slate-700/50 text-xs text-slate-500">
                        Updated: {new Date(config.updated_at.endsWith('Z') ? config.updated_at : config.updated_at + 'Z').toLocaleString()}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SharedConfig;
