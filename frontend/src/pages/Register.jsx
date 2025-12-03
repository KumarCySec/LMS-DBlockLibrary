import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../components/ui/Card';

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
        department_id: '', // We'll need to fetch departments or hardcode for now
        phone_number: ''
    });

    const [departments, setDepartments] = useState([]);

    useEffect(() => {
        // Fetch departments
        const fetchDepts = async () => {
            try {
                // We use fetch directly or axios instance without auth header if possible, 
                // but our axios instance might attach token if present. 
                // Since this is register, likely no token.
                // But let's import api from axios if we want base URL handling.
                // Assuming api handles it.
                const response = await fetch('http://localhost:5000/common/departments');
                if (response.ok) {
                    const data = await response.json();
                    setDepartments(data);
                    if (data.length > 0) {
                        setFormData(prev => ({ ...prev, department_id: data[0].id }));
                    }
                }
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
        <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4 py-8">
            <Card className="w-full max-w-sm">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-center text-indigo-600">Create Account</CardTitle>
                    <p className="text-sm text-center text-gray-500">Enter your details to register</p>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-3">
                        <div className="space-y-1">
                            <label className="text-xs font-medium" htmlFor="name">Full Name</label>
                            <Input id="name" value={formData.name} onChange={handleChange} required />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-medium" htmlFor="roll_number">Roll Number</label>
                            <Input id="roll_number" value={formData.roll_number} onChange={handleChange} required />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-medium" htmlFor="email">Email</label>
                            <Input id="email" type="email" value={formData.email} onChange={handleChange} required />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-medium" htmlFor="password">Password</label>
                            <Input id="password" type="password" value={formData.password} onChange={handleChange} required />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                                <label className="text-xs font-medium" htmlFor="batch">Batch</label>
                                <Input id="batch" placeholder="2022-2026" value={formData.batch} onChange={handleChange} required />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-medium" htmlFor="department_id">Department</label>
                                <select
                                    id="department_id"
                                    value={formData.department_id}
                                    onChange={handleChange}
                                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                    required
                                >
                                    <option value="" disabled>Select Dept</option>
                                    {departments.map(dept => (
                                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-medium" htmlFor="phone_number">Phone</label>
                            <Input id="phone_number" value={formData.phone_number} onChange={handleChange} />
                        </div>

                        {error && <p className="text-sm text-red-500">{error}</p>}
                        <Button className="w-full mt-2" type="submit" isLoading={isLoading}>
                            Register
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex justify-center">
                    <p className="text-sm text-gray-500">
                        Already have an account?{' '}
                        <Link to="/login" className="text-indigo-600 hover:underline">
                            Sign In
                        </Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
};

export default Register;
