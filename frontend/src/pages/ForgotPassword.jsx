import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowRight, Lock, KeyRound, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardContent } from '../components/ui/Card';
import StrengthMeter from '../components/ui/StrengthMeter';
import api from '../api/axios';

const ForgotPassword = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1); // 1: Email, 2: OTP & New Password
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState(null); // { type: 'success' | 'error', text: '' }

    const handleSendOtp = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);
        try {
            await api.post('/auth/forgot-password', { email });
            setMessage({ type: 'success', text: 'OTP sent to your email address.' });
            setStep(2);
        } catch (error) {
            setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to send OTP.' });
        } finally {
            setLoading(false);
        }
    };

    const validatePassword = (pwd) => {
        const hasLength = /.{8,}/.test(pwd);
        const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(pwd);
        return hasLength && hasSymbol;
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setMessage({ type: 'error', text: 'Passwords do not match' });
            return;
        }

        if (!validatePassword(password)) {
            setMessage({ type: 'error', text: "Password must be at least 8 characters and contain a symbol." });
            return;
        }

        setLoading(true);
        setMessage(null);
        try {
            await api.post('/auth/reset-password', { email, otp, password });
            setMessage({ type: 'success', text: 'Password reset successfully! Redirecting to login...' });
            setTimeout(() => navigate('/login'), 2000);
        } catch (error) {
            setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to reset password.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center">
                    <div className="mx-auto h-12 w-12 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                        <KeyRound className="h-6 w-6 text-indigo-600" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
                        {step === 1 ? 'Forgot Password?' : 'Reset Password'}
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        {step === 1
                            ? "Enter your email address and we'll send you an OTP to reset your password."
                            : "Enter the OTP sent to your email and your new password."}
                    </p>
                </div>

                <Card className="shadow-xl shadow-indigo-100/50 border-0 ring-1 ring-gray-100">
                    <CardContent className="p-8">
                        {message && (
                            <div className={`mb-6 p-4 rounded-lg flex items-start gap-3 text-sm ${message.type === 'success' ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'
                                }`}>
                                {message.type === 'success' ?
                                    <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" /> :
                                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                                }
                                <p>{message.text}</p>
                            </div>
                        )}

                        {step === 1 ? (
                            <form onSubmit={handleSendOtp} className="space-y-6">
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                        Email Address
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Mail className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <Input
                                            id="email"
                                            type="email"
                                            required
                                            className="pl-10"
                                            placeholder="you@example.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <Button type="submit" className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200" isLoading={loading}>
                                    Send OTP <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </form>
                        ) : (
                            <form onSubmit={handleResetPassword} className="space-y-6">
                                <div>
                                    <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-1">
                                        Enter OTP
                                    </label>
                                    <Input
                                        id="otp"
                                        type="text"
                                        required
                                        className="text-center tracking-[0.5em] font-mono text-lg font-bold"
                                        placeholder="••••••"
                                        maxLength={6}
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                    />
                                    <p className="mt-1 text-xs text-center text-gray-500">Check your email inbox/spam folder.</p>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                                            New Password
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <Lock className="h-5 w-5 text-gray-400" />
                                            </div>
                                            <Input
                                                id="password"
                                                type="password"
                                                required
                                                className="pl-10"
                                                placeholder="••••••••"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                            />
                                        </div>
                                        {password && <StrengthMeter password={password} />}
                                    </div>

                                    <div>
                                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                                            Confirm New Password
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <Lock className="h-5 w-5 text-gray-400" />
                                            </div>
                                            <Input
                                                id="confirmPassword"
                                                type="password"
                                                required
                                                className={`pl-10 ${confirmPassword && (password === confirmPassword ? 'border-emerald-500 focus:ring-emerald-200' : 'border-red-300 focus:ring-red-200')}`}
                                                placeholder="••••••••"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                            />
                                            {confirmPassword && (
                                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                                    {password === confirmPassword ? (
                                                        <CheckCircle className="h-5 w-5 text-emerald-500" />
                                                    ) : (
                                                        <AlertCircle className="h-5 w-5 text-red-500" />
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        {confirmPassword && (
                                            <p className={`text-xs mt-1 font-medium ${password === confirmPassword ? 'text-emerald-600' : 'text-red-500'}`}>
                                                {password === confirmPassword ? 'Passwords match' : 'Passwords do not match'}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <Button type="submit" className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200" isLoading={loading}>
                                    Reset Password
                                </Button>

                                <button
                                    type="button"
                                    onClick={() => { setStep(1); setMessage(null); }}
                                    className="w-full text-sm text-gray-500 hover:text-indigo-600"
                                >
                                    Wrong email? Go back
                                </button>
                            </form>
                        )}
                    </CardContent>
                </Card>

                <p className="text-center text-sm text-gray-600">
                    Remember your password?{' '}
                    <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500 hover:underline transition-all">
                        Sign in here
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default ForgotPassword;
