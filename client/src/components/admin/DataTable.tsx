/* eslint-disable */
"use client";

import React from 'react';
import { useThemeStore } from '@/lib/store/themeStore';

interface DataTableProps {
    headers: string[];
    data: any[];
    actions?: (item: any, index: number) => React.ReactNode;
    loading?: boolean;
    emptyMessage?: string;
}

const DataTable: React.FC<DataTableProps> = ({ 
    headers, 
    data, 
    actions, 
    loading = false, 
    emptyMessage = "No data available" 
}) => {
    const { theme } = useThemeStore();

    if (loading) {
        return (
            <div className={`overflow-hidden rounded-lg border ${
                theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
            }`}>
                <div className={`px-6 py-4 ${
                    theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'
                }`}>
                    <div className="h-4 bg-gray-300 rounded w-32 animate-pulse"></div>
                </div>
                <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                            <div className="flex space-x-4">
                                {headers.map((_, j) => (
                                    <div key={j} className="h-4 bg-gray-300 rounded flex-1 animate-pulse"></div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className={`overflow-hidden rounded-lg border ${
            theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
        }`}>
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'}`}>
                    <tr>
                        {headers.map((header, index) => (
                            <th
                                key={index}
                                className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                                    theme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                                }`}
                            >
                                {header}
                            </th>
                        ))}
                        {actions && (
                            <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                                theme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                            }`}>
                                Actions
                            </th>
                        )}
                    </tr>
                </thead>
                <tbody className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} divide-y ${
                    theme === 'dark' ? 'divide-gray-700' : 'divide-gray-200'
                }`}>
                    {data.length === 0 ? (
                        <tr>
                            <td
                                colSpan={headers.length + (actions ? 1 : 0)}
                                className={`px-6 py-8 text-center text-sm ${
                                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                                }`}
                            >
                                {emptyMessage}
                            </td>
                        </tr>
                    ) : (
                        data.map((item, index) => (
                            <tr key={index} className={`hover:${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'} transition-colors`}>
                                {headers.map((header, headerIndex) => (
                                    <td
                                        key={headerIndex}
                                        className={`px-6 py-4 whitespace-nowrap text-sm ${
                                            theme === 'dark' ? 'text-gray-300' : 'text-gray-900'
                                        }`}
                                    >
                                        {item[header.toLowerCase().replace(/\s+/g, '')] || '-'}
                                    </td>
                                ))}
                                {actions && (
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        {actions(item, index)}
                                    </td>
                                )}
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default DataTable;