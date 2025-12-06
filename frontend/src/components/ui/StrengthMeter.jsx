import React, { useMemo } from 'react';
import { Check, X } from 'lucide-react';

const StrengthMeter = ({ password }) => {
    const requirements = useMemo(() => [
        { regex: /.{8,}/, label: "At least 8 characters" },
        { regex: /[0-9]/, label: "Contains a number" },
        { regex: /[!@#$%^&*(),.?":{}|<>]/, label: "Contains a special symbol" },
    ], []);

    const strength = requirements.reduce((s, req) => s + (req.regex.test(password) ? 1 : 0), 0);
    const score = (strength / requirements.length) * 100;

    const getColor = () => {
        if (score <= 33) return 'bg-red-500';
        if (score <= 66) return 'bg-yellow-500';
        return 'bg-emerald-500';
    };

    const getLabel = () => {
        if (score <= 33) return 'Weak';
        if (score <= 66) return 'Medium';
        return 'Strong';
    };

    return (
        <div className="space-y-2 mt-2">
            <div className="flex justify-between items-center text-xs">
                <span className="font-medium text-slate-500">Strength:</span>
                <span className={`font-bold ${score <= 33 ? 'text-red-500' : score <= 66 ? 'text-yellow-600' : 'text-emerald-600'
                    }`}>{getLabel()}</span>
            </div>

            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                    className={`h-full ${getColor()} transition-all duration-300 ease-out`}
                    style={{ width: `${Math.max(5, score)}%` }}
                />
            </div>

            <div className="grid grid-cols-1 gap-1 pt-1">
                {requirements.map((req, i) => {
                    const met = req.regex.test(password);
                    return (
                        <div key={i} className={`flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wide transition-colors ${met ? 'text-emerald-600' : 'text-slate-400'
                            }`}>
                            {met ? <Check className="w-3 h-3" /> : <div className="w-3 h-3 rounded-full border border-slate-300" />}
                            {req.label}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default StrengthMeter;
