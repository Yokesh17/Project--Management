import React, { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import api from '../utils/api';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

const NotificationCenter = () => {
    const [notifications, setNotifications] = useState([]);
    const [show, setShow] = useState(false);
    const unreadCount = notifications.filter(n => !n.is_read).length;

    const fetchNotifications = async () => {
        try {
            const res = await api.get('/notifications/');
            setNotifications(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        if (show && unreadCount > 0) {
            api.put('/notifications/read-all');
            // Optimistically mark all read
            setNotifications(notifications.map(n => ({ ...n, is_read: true })));
        }
    }, [show]);

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 60000); // Poll every minute
        return () => clearInterval(interval);
    }, []);

    const markRead = async (id) => {
        try {
            await api.put(`/notifications/${id}/read`);
            setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="relative">
            <button onClick={() => setShow(!show)} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition relative">
                <Bell size={18} />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full indicator"></span>
                )}
            </button>

            <AnimatePresence>
                {show && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setShow(false)}></div>
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute right-0 mt-2 w-80 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden"
                        >
                            <div className="p-3 border-b border-slate-700 bg-slate-800/90 backdrop-blur pb-2">
                                <h3 className="text-sm font-semibold text-white">Notifications</h3>
                            </div>
                            <div className="max-h-96 overflow-y-auto">
                                {notifications.length === 0 ? (
                                    <div className="p-8 text-center text-slate-500 text-xs">No notifications</div>
                                ) : (
                                    notifications.map(n => (
                                        <div
                                            key={n.id}
                                            className={`p-3 border-b border-slate-700/50 hover:bg-slate-700/30 transition cursor-pointer ${!n.is_read ? 'bg-slate-700/10' : ''}`}
                                            onClick={() => markRead(n.id)}
                                        >
                                            <p className={`text-xs ${!n.is_read ? 'text-slate-200 font-medium' : 'text-slate-400'}`}>
                                                {n.content}
                                            </p>
                                            <span className="text-[10px] text-slate-500 mt-1 block">
                                                {formatDistanceToNow(new Date(n.created_at.endsWith('Z') ? n.created_at : n.created_at + 'Z'), { addSuffix: true })}
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default NotificationCenter;
