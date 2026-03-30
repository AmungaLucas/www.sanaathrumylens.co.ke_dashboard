'use client';

import {
    LineChart,
    Line,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';

export default function PerformanceChart({ data }) {
    if (!data || data.length === 0) {
        return (
            <div className="h-80 flex items-center justify-center text-gray-500">
                No data available
            </div>
        );
    }

    return (
        <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip
                    contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '0.5rem',
                    }}
                />
                <Area
                    type="monotone"
                    dataKey="views"
                    stackId="1"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.1}
                    name="Views"
                />
                <Area
                    type="monotone"
                    dataKey="likes"
                    stackId="2"
                    stroke="#ef4444"
                    fill="#ef4444"
                    fillOpacity={0.1}
                    name="Likes"
                />
                <Line
                    type="monotone"
                    dataKey="comments"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    dot={false}
                    name="Comments"
                />
            </AreaChart>
        </ResponsiveContainer>
    );
}