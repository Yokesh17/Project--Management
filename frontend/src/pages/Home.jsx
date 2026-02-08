import React from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Folder, CheckCircle, Smartphone, Globe, ArrowRight, Shield, Zap, Layout } from 'lucide-react';

const Home = () => {
    const { isAuthenticated } = useSelector((state) => state.auth);

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-indigo-500/30">
            {/* Navbar */}
            <nav className="fixed w-full z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
                                <Folder size={18} className="text-white" />
                            </div>
                            <span className="text-lg font-bold tracking-tight">ProjectManager</span>
                        </div>
                        <div className="flex items-center gap-4">
                            {isAuthenticated ? (
                                <Link
                                    to="/dashboard"
                                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-all shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/40"
                                >
                                    Go to Dashboard
                                </Link>
                            ) : (
                                <>
                                    <Link to="/login" className="text-sm font-medium text-slate-300 hover:text-white transition">
                                        Log in
                                    </Link>
                                    <Link
                                        to="/signup"
                                        className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-all shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/40"
                                    >
                                        Sign up
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <div className="relative pt-32 pb-20 sm:pt-40 sm:pb-24 overflow-hidden">
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-[30%] -left-[10%] w-[70%] h-[70%] rounded-full bg-indigo-500/10 blur-3xl"></div>
                    <div className="absolute top-[20%] -right-[10%] w-[50%] h-[50%] rounded-full bg-blue-500/10 blur-3xl"></div>
                </div>

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight mb-6 bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                        Manage projects with <br className="hidden sm:block" />
                        <span className="text-indigo-400">unmatched efficiency</span>
                    </h1>
                    <p className="max-w-2xl mx-auto text-lg sm:text-xl text-slate-400 mb-8 leading-relaxed">
                        The all-in-one workspace for your personal projects. track tasks, collaborate with others, and stay organized—all in one place.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link
                            to={isAuthenticated ? "/dashboard" : "/signup"}
                            className="w-full sm:w-auto px-8 py-3.5 text-base font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all shadow-xl shadow-indigo-600/20 hover:shadow-indigo-600/40 flex items-center justify-center gap-2"
                        >
                            {isAuthenticated ? "Go to Dashboard" : "Start for Free"} <ArrowRight size={18} />
                        </Link>
                        <a
                            href="#features"
                            className="w-full sm:w-auto px-8 py-3.5 text-base font-semibold text-slate-300 bg-slate-800/50 hover:bg-slate-800 rounded-xl border border-slate-700 hover:border-slate-600 transition flex items-center justify-center"
                        >
                            Learn more
                        </a>
                    </div>

                    {/* Hero Image Mockup */}
                    <div className="mt-16 relative">
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent z-10"></div>
                        <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-2xl overflow-hidden max-w-5xl mx-auto transform rotate-x-12 perspective-1000">
                            {/* Simple CSS representation of dashboard */}
                            <div className="h-6 bg-slate-900 border-b border-slate-700 flex items-center px-4 gap-2">
                                <div className="w-2.5 h-2.5 rounded-full bg-red-500/50"></div>
                                <div className="w-2.5 h-2.5 rounded-full bg-amber-500/50"></div>
                                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/50"></div>
                            </div>
                            <div className="p-4 grid grid-cols-3 gap-4 h-[300px] sm:h-[400px] opacity-50">
                                <div className="bg-slate-700/30 rounded-lg h-full"></div>
                                <div className="bg-slate-700/30 rounded-lg h-full"></div>
                                <div className="bg-slate-700/30 rounded-lg h-full"></div>
                            </div>
                            <div className="absolute inset-0 flex items-center justify-center z-20">
                                <p className="text-slate-500 font-mono text-sm">[Interactive Dashboard Preview]</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Features */}
            <div id="features" className="py-20 bg-slate-900">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-blue-400 font-semibold tracking-wide uppercase text-sm mb-2">Features</h2>
                        <h3 className="text-3xl font-bold text-white">Everything you need to ship faster</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={<Layout className="text-indigo-400" />}
                            title="Kanban Boards"
                            description="Visualize your workflow with intuitive drag-and-drop boards. Customize stages to fit your process."
                        />
                        <FeatureCard
                            icon={<Zap className="text-amber-400" />}
                            title="Real-time Updates"
                            description="Changes happen instantly. Collaborate with others without refreshing the page."
                        />
                        <FeatureCard
                            icon={<Globe className="text-cyan-400" />}
                            title="Accessible Anywhere"
                            description="Access your projects from any device. Optimized for mobile, tablet, and desktop."
                        />
                        <FeatureCard
                            icon={<Shield className="text-emerald-400" />}
                            title="Secure & Private"
                            description="Your data is encrypted and secure. Invite members to specific projects with granular control."
                        />
                        <FeatureCard
                            icon={<CheckCircle className="text-pink-400" />}
                            title="Task Tracking"
                            description="Set due dates, priorities, and assignments. Never miss a deadline again."
                        />
                        <FeatureCard
                            icon={<Smartphone className="text-purple-400" />}
                            title="VS Code Integration"
                            description="Manage tasks directly from your code editor with our custom extension."
                        />
                    </div>
                </div>
            </div>

            {/* Pricing / Plans */}
            <div className="py-20 bg-slate-800/30 border-y border-slate-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-indigo-400 font-semibold tracking-wide uppercase text-sm mb-2">Pricing</h2>
                        <h3 className="text-3xl font-bold text-white">Simple, transparent pricing</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                        {/* Free Plan */}
                        <div className="bg-slate-800 rounded-2xl p-8 border border-slate-700 hover:border-slate-600 transition relative overflow-hidden">
                            <h3 className="text-xl font-semibold text-white mb-2">Free Plan</h3>
                            <div className="flex items-baseline gap-1 mb-6">
                                <span className="text-4xl font-bold text-white">$0</span>
                                <span className="text-slate-500">/month</span>
                            </div>
                            <ul className="space-y-4 mb-8">
                                <li className="flex items-center gap-3 text-slate-300 text-sm">
                                    <CheckCircle size={16} className="text-emerald-500" /> 1 Project Limit
                                </li>
                                <li className="flex items-center gap-3 text-slate-300 text-sm">
                                    <CheckCircle size={16} className="text-emerald-500" /> Unlimited Tasks
                                </li>
                                <li className="flex items-center gap-3 text-slate-300 text-sm">
                                    <CheckCircle size={16} className="text-emerald-500" /> Basic Analytics
                                </li>
                            </ul>
                            <Link to="/signup" className="block w-full text-center py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition">
                                Get Started
                            </Link>
                        </div>

                        {/* Pro Plan */}
                        <div className="bg-slate-800 rounded-2xl p-8 border border-indigo-500/50 shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 bg-indigo-500 text-white text-[10px] uppercase font-bold px-3 py-1 rounded-bl-lg">
                                Recommended
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-2">Pro Plan</h3>
                            <div className="flex items-baseline gap-1 mb-6">
                                <span className="text-4xl font-bold text-white">$9</span>
                                <span className="text-slate-500">/month</span>
                            </div>
                            <ul className="space-y-4 mb-8">
                                <li className="flex items-center gap-3 text-slate-300 text-sm">
                                    <CheckCircle size={16} className="text-emerald-500" /> 10 Projects Limit
                                </li>
                                <li className="flex items-center gap-3 text-slate-300 text-sm">
                                    <CheckCircle size={16} className="text-emerald-500" /> AI Agent Assistance
                                </li>
                                <li className="flex items-center gap-3 text-slate-300 text-sm">
                                    <CheckCircle size={16} className="text-emerald-500" /> Priority Support
                                </li>
                                <li className="flex items-center gap-3 text-slate-300 text-sm">
                                    <CheckCircle size={16} className="text-emerald-500" /> Advanced Analytics
                                </li>
                                <li className="flex items-center gap-3 text-slate-300 text-sm">
                                    <CheckCircle size={16} className="text-emerald-500" /> VS Code Extension
                                </li>
                            </ul>
                            <button className="block w-full text-center py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition">
                                Upgrade Now
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="bg-slate-950 py-12 border-t border-slate-900">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <div className="w-6 h-6 bg-slate-800 rounded flex items-center justify-center">
                            <Folder size={14} className="text-slate-400" />
                        </div>
                        <span className="text-slate-400 font-semibold">ProjectManager</span>
                    </div>
                    <p className="text-slate-500 text-sm">
                        © {new Date().getFullYear()} Project Manager App. All rights reserved.
                    </p>
                </div>
            </footer>
        </div>
    );
};

const FeatureCard = ({ icon, title, description }) => (
    <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50 hover:border-slate-600 transition group hover:bg-slate-800">
        <div className="w-12 h-12 bg-slate-900 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition duration-300 border border-slate-700">
            {icon}
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
        <p className="text-slate-400 text-sm leading-relaxed">{description}</p>
    </div>
);

export default Home;
