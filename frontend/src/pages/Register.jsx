import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../components/ui/Card';
import StrengthMeter from '../components/ui/StrengthMeter';
import gceLogo from '../assets/gce_logo.png';
import { Eye, EyeOff } from 'lucide-react';

import api from '../api/axios';

const Register = () => {
    const navigate = useNavigate();
    const { register } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

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

    const validatePassword = (pwd) => {
        const hasLength = /.{8,}/.test(pwd);
        const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(pwd);
        return hasLength && hasSymbol;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!validatePassword(formData.password)) {
            setError("Password must be at least 8 characters and contain a symbol.");
            return;
        }

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
        <div className="min-h-screen h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-100 via-slate-50 to-blue-100">
            {/* Background Decor */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] right-[-10%] w-[60vh] h-[60vh] rounded-full bg-indigo-300/20 blur-[100px] animate-pulse"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[50vh] h-[50vh] rounded-full bg-blue-300/20 blur-[100px] animate-pulse delay-700"></div>
            </div>

            <div className="z-10 w-full max-w-md mx-auto flex flex-col gap-4 animate-fade-in-up h-full justify-center">
                {/* Header - Compact */}
                <div className="text-center shrink-0">
                    <div className="inline-flex items-center justify-center gap-3 mb-2">
                        <div className="p-2 rounded-xl bg-white shadow-lg shadow-indigo-100/50">
                            <img src={gceLogo} alt="GCE Logo" className="w-10 h-10 object-contain" />
                        </div>
                        <h1 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-600 tracking-tight">
                            D-Block Library
                        </h1>
                    </div>
                </div>

                {/* Register Card */}
                <Card className="w-full shadow-2xl shadow-indigo-200/50 border-0 bg-white/90 backdrop-blur-xl ring-1 ring-white/50 rounded-2xl overflow-hidden flex flex-col max-h-[80vh]">
                    <CardHeader className="pb-2 pt-5 text-center space-y-0.5 shrink-0">
                        <CardTitle className="text-xl font-bold text-slate-800">Create Account</CardTitle>
                        <p className="text-xs text-slate-500 font-medium">Join our community</p>
                    </CardHeader>

                    <CardContent className="px-6 py-4 overflow-y-auto custom-scrollbar">
                        <form onSubmit={handleSubmit} className="space-y-3">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1" htmlFor="name">Full Name</label>
                                <Input id="name" value={formData.name} onChange={handleChange} required className="h-9 bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 rounded-lg text-sm" placeholder="John Doe" />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1" htmlFor="roll_number">Roll No</label>
                                    <Input
                                        id="roll_number"
                                        value={formData.roll_number}
                                        onChange={(e) => {
                                            const val = e.target.value.toUpperCase();
                                            handleChange({ target: { id: 'roll_number', value: val } });
                                            if (val.length >= 5) {
                                                const deptCode = val.substring(2, 5);
                                                const dept = departments.find(d => d.name.toUpperCase() === deptCode);
                                                if (dept) setFormData(prev => ({ ...prev, department_id: dept.id, roll_number: val }));
                                            }
                                        }}
                                        required
                                        className="h-9 bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 rounded-lg text-sm"
                                        placeholder="23ECE01"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1" htmlFor="batch">Batch</label>
                                    <Input
                                        id="batch"
                                        placeholder="2026"
                                        value={formData.batch}
                                        onChange={handleChange}
                                        required
                                        className="h-9 bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 rounded-lg text-sm"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1" htmlFor="email">Email</label>
                                <Input id="email" type="email" value={formData.email} onChange={handleChange} required className="h-9 bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 rounded-lg text-sm" placeholder="student@gce.edu" />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1" htmlFor="phone_number">Phone</label>
                                <Input id="phone_number" value={formData.phone_number} onChange={handleChange} className="h-9 bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 rounded-lg text-sm" placeholder="+91..." />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1" htmlFor="password">Password</label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        value={formData.password}
                                        onChange={handleChange}
                                        required
                                        className="h-9 bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 rounded-lg text-sm pr-10"
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                                {formData.password && <StrengthMeter password={formData.password} />}
                            </div>

                            {formData.department_id && (
                                <div className="text-[10px] text-center text-indigo-600 font-bold bg-indigo-50/50 p-1.5 rounded-lg border border-indigo-100">
                                    Dept: {departments.find(d => d.id === formData.department_id)?.name || 'Unknown'}
                                </div>
                            )}

                            {error && (
                                <div className="p-2.5 rounded-lg bg-red-50 border border-red-100 text-center">
                                    <p className="text-xs font-bold text-red-600">{error}</p>
                                </div>
                            )}

                            <Button
                                className="w-full h-10 text-sm font-bold bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 shadow-lg shadow-indigo-500/30 rounded-xl mt-1 transition-all active:scale-[0.98]"
                                type="submit"
                                isLoading={isLoading}
                            >
                                Register
                            </Button>
                        </form>
                    </CardContent>

                    <CardFooter className="bg-slate-50/80 border-t border-slate-100 py-3 justify-center shrink-0">
                        <p className="text-xs text-slate-500 font-medium">
                            Already have an account?{' '}
                            <Link to="/login" className="text-indigo-600 font-bold hover:text-indigo-700 transition-colors">
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
