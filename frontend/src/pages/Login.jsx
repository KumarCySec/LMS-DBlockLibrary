import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../components/ui/Card';
import gceLogo from '../assets/gce_logo.png';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        const result = await login(email, password);

        if (result.success) {
            navigate('/');
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

            <div className="z-10 w-full max-w-sm mx-auto flex flex-col gap-6 animate-fade-in-up">
                {/* Header */}
                <div className="text-center space-y-2">
                    <div className="inline-block p-3 rounded-2xl bg-white shadow-xl shadow-indigo-100/50 mb-2 transform hover:scale-105 transition-transform duration-300">
                        <img src={gceLogo} alt="GCE Logo" className="w-16 h-16 object-contain" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-slate-800 tracking-tight">Government College of Engineering, Erode</h1>
                        <p className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-600 tracking-tight">
                            D-Block Library
                        </p>
                    </div>
                </div>

                {/* Login Card */}
                <Card className="w-full shadow-2xl shadow-indigo-200/50 border-0 bg-white/90 backdrop-blur-xl ring-1 ring-white/50 rounded-2xl overflow-hidden">
                    <CardHeader className="pb-2 pt-6 text-center space-y-1">
                        <CardTitle className="text-xl font-bold text-slate-800">Welcome Back</CardTitle>
                        <p className="text-xs text-slate-500 font-medium">Sign in to your account</p>
                    </CardHeader>
                    <CardContent className="px-6 pb-6 pt-4">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1" htmlFor="email">Email</label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="student@gce.edu"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="h-10 bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 rounded-xl text-sm"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <div className="flex justify-between items-center pl-1">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest" htmlFor="password">Password</label>
                                    <Link to="/forgot-password" className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 hover:underline">
                                        Forgot?
                                    </Link>
                                </div>
                                <Input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="h-10 bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 rounded-xl text-sm"
                                    placeholder="••••••••"
                                />
                            </div>

                            {error && (
                                <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-center">
                                    <p className="text-xs font-bold text-red-600">{error}</p>
                                </div>
                            )}

                            <Button
                                className="w-full h-11 text-sm font-bold bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 shadow-lg shadow-indigo-500/30 rounded-xl mt-2 transition-all active:scale-[0.98]"
                                type="submit"
                                isLoading={isLoading}
                            >
                                Sign In
                            </Button>
                        </form>
                    </CardContent>
                    <CardFooter className="bg-slate-50/80 border-t border-slate-100 py-4 justify-center">
                        <p className="text-xs text-slate-500 font-medium">
                            New here?{' '}
                            <Link to="/register" className="text-indigo-600 font-bold hover:text-indigo-700 transition-colors">
                                Create an account
                            </Link>
                        </p>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
};

export default Login;
