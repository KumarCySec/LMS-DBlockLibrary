import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../components/ui/Card';
import gceLogo from '../assets/gce_logo.png';

import api from '../api/axios';

const Register = () => {
    const navigate = useNavigate();
    const { register } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        roll_number: '',
        email: '',
        password: '',
        batch: '',
        department_id: '',
        phone_number: ''
    });

    const [departments, setDepartments] = useState([]);

    useEffect(() => {
        const fetchDepts = async () => {
            try {
                const response = await api.get('/common/departments');
                const data = response.data;
                setDepartments(data);
                // Don't auto-select, let roll number decide
            } catch (err) {
                console.error("Failed to fetch departments", err);
            }
        };
        fetchDepts();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        const result = await register(formData);

        if (result.success) {
            navigate('/login');
        } else {
            setError(result.error);
        }
        setIsLoading(false);
    };

    return (
        <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-100 via-slate-50 to-blue-100 flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Decorative Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute -top-[20%] -right-[10%] w-[50%] h-[50%] rounded-full bg-indigo-200/30 blur-3xl animate-pulse"></div>
                <div className="absolute top-[40%] -left-[10%] w-[40%] h-[40%] rounded-full bg-blue-200/30 blur-3xl animate-pulse delay-1000"></div>
            </div>

            <div className="z-10 w-full max-w-5xl mx-auto flex flex-col items-center gap-8 my-8">
                {/* Header Section */}
                <div className="flex flex-col items-center text-center gap-2 animate-fade-in-down">
                    <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6">
                        <div className="p-3 bg-white rounded-2xl shadow-sm border border-indigo-50">
                            <img src={gceLogo} alt="GCE Logo" className="w-16 md:w-20 h-auto object-contain" />
                        </div>
                        <h1 className="text-xl md:text-3xl font-bold text-slate-800 tracking-tight">
                            Government College of Engineering, Erode
                        </h1>
                    </div>
                    <div className="h-1 w-24 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full my-2"></div>
                    <p className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-600 tracking-tight drop-shadow-sm">
                        D-Block Library
                    </p>
                </div>

                {/* Register Card */}
                <Card className="w-full max-w-lg shadow-2xl border-0 bg-white/80 backdrop-blur-xl ring-1 ring-white/50">
                    <CardHeader className="space-y-1 pb-6 pt-8">
                        <CardTitle className="text-2xl font-bold text-center text-slate-800">Create Account</CardTitle>
                        <p className="text-sm text-center text-slate-500 font-medium">Join the D-Block Library Community</p>
                    </CardHeader>
                    <CardContent className="px-8 pb-8">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider" htmlFor="name">Full Name</label>
                                <Input id="name" value={formData.name} onChange={handleChange} required className="h-10 bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 transition-all rounded-lg" placeholder="John Doe" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider" htmlFor="roll_number">Roll Number</label>
                                    <Input
                                        id="roll_number"
                                        value={formData.roll_number}
                                        onChange={(e) => {
                                            const val = e.target.value.toUpperCase();
                                            handleChange({ target: { id: 'roll_number', value: val } });

                                            // Smart Dept Extraction
                                            // Format: YYDDDNN (e.g., 23ECE01)
                                            // We expect at least 5 chars to get the code
                                            if (val.length >= 5) {
                                                const deptCode = val.substring(2, 5); // Extract chars at index 2,3,4
                                                const dept = departments.find(d => d.name.toUpperCase() === deptCode);
                                                if (dept) {
                                                    setFormData(prev => ({ ...prev, department_id: dept.id, roll_number: val }));
                                                } else {
                                                    // Reset or keep previous? Let's keep previous but maybe warn?
                                                    // For now just update roll no
                                                    setFormData(prev => ({ ...prev, roll_number: val }));
                                                }
                                            } else {
                                                setFormData(prev => ({ ...prev, roll_number: val }));
                                            }
                                        }}
                                        required
                                        className="h-10 bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 transition-all rounded-lg"
                                        placeholder="23ECE01"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider" htmlFor="batch">Batch (Year)</label>
                                    <Input
                                        id="batch"
                                        placeholder="2026"
                                        value={formData.batch}
                                        onChange={handleChange}
                                        required
                                        className="h-10 bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 transition-all rounded-lg"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider" htmlFor="email">Email Address</label>
                                <Input id="email" type="email" value={formData.email} onChange={handleChange} required className="h-10 bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 transition-all rounded-lg" placeholder="john@example.com" />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider" htmlFor="password">Password</label>
                                <Input id="password" type="password" value={formData.password} onChange={handleChange} required className="h-10 bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 transition-all rounded-lg" placeholder="••••••••" />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider" htmlFor="phone_number">Phone</label>
                                <Input id="phone_number" value={formData.phone_number} onChange={handleChange} className="h-10 bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 transition-all rounded-lg" placeholder="+91..." />
                            </div>

                            {/* Hidden Dept Display for Verification */}
                            {formData.department_id && (
                                <div className="text-xs text-center text-indigo-600 font-medium bg-indigo-50 p-2 rounded">
                                    Detected Department: {departments.find(d => d.id === formData.department_id)?.name || 'Unknown'}
                                </div>
                            )}

                            {error && (
                                <div className="p-4 rounded-lg bg-red-50 border border-red-100 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                                    <div className="text-red-600 text-sm font-medium leading-relaxed">{error}</div>
                                </div>
                            )}

                            <Button
                                className="w-full h-12 text-base font-semibold bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/40 transition-all rounded-lg mt-2"
                                type="submit"
                                isLoading={isLoading}
                            >
                                Create Account
                            </Button>
                        </form>
                    </CardContent>
                    <CardFooter className="flex justify-center pb-8 pt-2 bg-slate-50/50 border-t border-slate-100">
                        <p className="text-sm text-slate-500 font-medium">
                            Already have an account?{' '}
                            <Link to="/login" className="text-indigo-600 font-bold hover:text-indigo-700 hover:underline transition-colors">
                                Sign In
                            </Link>
                        </p>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
};

export default Register;
