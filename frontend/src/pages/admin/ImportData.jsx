import React, { useState } from 'react';
import api from '../../api/axios';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Loader2, Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';

const ImportData = () => {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [stats, setStats] = useState(null);
    const [error, setError] = useState(null);

    const handleFileChange = (e) => {
        if (e.target.files[0]) {
            setFile(e.target.files[0]);
            setStats(null);
            setError(null);
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setUploading(true);
        setError(null);
        setStats(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await api.post('/import/csv', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            setStats(response.data);
        } catch (err) {
            console.error("Upload failed", err);
            setError(err.response?.data?.error || "Failed to upload file");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="p-4 max-w-4xl mx-auto pb-24">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                    <Upload className="w-6 h-6" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">Import Data</h1>
            </div>

            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>Upload CSV</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col gap-4">
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:bg-gray-50 transition-colors">
                            <input
                                type="file"
                                accept=".csv"
                                onChange={handleFileChange}
                                className="hidden"
                                id="csv-upload"
                            />
                            <label htmlFor="csv-upload" className="cursor-pointer flex flex-col items-center">
                                <FileText className="w-12 h-12 text-gray-400 mb-2" />
                                <span className="text-sm text-gray-600 font-medium">
                                    {file ? file.name : "Click to select DB.csv"}
                                </span>
                                <span className="text-xs text-gray-400 mt-1">
                                    Supports .csv files only
                                </span>
                            </label>
                        </div>

                        <Button
                            onClick={handleUpload}
                            disabled={!file || uploading}
                            className="w-full sm:w-auto self-end"
                        >
                            {uploading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Importing...
                                </>
                            ) : (
                                <>
                                    <Upload className="w-4 h-4 mr-2" />
                                    Start Import
                                </>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card className="mb-6 border-red-200 bg-red-50">
                <CardHeader>
                    <CardTitle className="text-red-800 text-lg">Danger Zone</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-red-600 mb-4">
                        If you need to restart the import process, you can clear all existing inventory and donor data.
                        This action is irreversible and will delete all books, copies, and donors.
                    </p>
                    <Button
                        variant="destructive"
                        onClick={async () => {
                            if (window.confirm("Are you sure? This will delete ALL inventory and donor data.")) {
                                try {
                                    await api.post('/import/clear');
                                    alert("Data cleared successfully.");
                                    setStats(null);
                                } catch (e) {
                                    alert("Failed to clear data: " + (e.response?.data?.error || e.message));
                                }
                            }
                        }}
                    >
                        Clear All Inventory Data
                    </Button>
                </CardContent>
            </Card>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 mt-0.5" />
                    <div>
                        <h3 className="font-bold">Import Failed</h3>
                        <p>{error}</p>
                    </div>
                </div>
            )}

            {stats && (
                <div className="space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Card>
                            <CardContent className="p-4 text-center">
                                <p className="text-xs text-gray-500 uppercase font-bold">Processed</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.processed}</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4 text-center">
                                <p className="text-xs text-gray-500 uppercase font-bold">Items Created</p>
                                <p className="text-2xl font-bold text-emerald-600">{stats.items_created}</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4 text-center">
                                <p className="text-xs text-gray-500 uppercase font-bold">Copies Created</p>
                                <p className="text-2xl font-bold text-blue-600">{stats.copies_created}</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4 text-center">
                                <p className="text-xs text-gray-500 uppercase font-bold">Donors Created</p>
                                <p className="text-2xl font-bold text-purple-600">{stats.donors_created}</p>
                            </CardContent>
                        </Card>
                    </div>

                    {stats.errors && stats.errors.length > 0 && (
                        <Card className="border-orange-200 bg-orange-50">
                            <CardHeader>
                                <CardTitle className="text-orange-800 text-lg flex items-center gap-2">
                                    <AlertCircle className="w-5 h-5" />
                                    Import Warnings
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="list-disc list-inside text-sm text-orange-700 space-y-1 max-h-60 overflow-y-auto">
                                    {stats.errors.map((err, idx) => (
                                        <li key={idx}>{err}</li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                    )}

                    {stats.errors.length === 0 && (
                        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 rounded-lg flex items-center gap-3">
                            <CheckCircle className="w-5 h-5" />
                            <p className="font-medium">Import completed successfully with no errors!</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ImportData;
