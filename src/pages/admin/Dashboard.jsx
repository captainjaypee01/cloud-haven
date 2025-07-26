import React, { useEffect, useState } from 'react';
import { useApi } from '@/hooks/useApi';
import { API_PREFIX } from '@/constants/api';
import Title from '@/components/Title';
import { Card } from '@/components/ui/card';
import { StatusBadge } from '@/components/admin/common/StatusBadge';
import { formatCurrency } from '@/lib/format';
import { Users, CalendarCheck, DollarSign, Star } from 'lucide-react';  // example icons
// Recharts components
import { ResponsiveContainer, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

const Dashboard = () => {
    const api = useApi();
    const [dashboardData, setDashboardData] = useState({
        metrics: { totalBookings: 0, totalRevenue: 0, totalGuests: 0, averageRating: null },
        top_rooms: [],
        monthly_stats: [],
        bookings_today_tomorrow: []
    });

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const res = await api.get(`${API_PREFIX}/admin/dashboard`, { requiresAuth: true });
                console.log('res', res)
                if (res.data) {
                    setDashboardData(res.data);
                }
            } catch (err) {
                console.error('Failed to load dashboard data', err);
            }
        };
        fetchDashboard();
    }, [api]);

    const { metrics, top_rooms, monthly_stats, bookings_today_tomorrow } = dashboardData;

    // Prepare data for charts
    const topRoomsData = top_rooms;  // [{ name, count }, ...]
    const monthlyData = monthly_stats;  // [{ month, bookings, guests, revenue }, ...]

    // Helper to display room info (if multiple rooms in a booking)
    const formatRooms = (roomsArr) => {
        if (!roomsArr || roomsArr.length === 0) return '';
        if (roomsArr.length === 1) return roomsArr[0];
        // If multiple, show first room + "+X more"
        return `${roomsArr[0]} + ${roomsArr.length - 1} more`;
    };

    return (
        <div className="p-4">
            {/* Page title */}
            <Title
                align="left"
                font="outfit"
                title="Dashboard"
                subTitle="Monitor your room listings, track bookings, and analyze revenue — all in one place. Stay updated with real-time insights to ensure smooth operations."
            />

            {/* Overview metric cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 my-6">
                {/* Total Bookings */}
                <Card className="flex items-center p-4">
                    <CalendarCheck className="hidden sm:block text-primary w-8 h-8" />
                    <div className="ml-3">
                        <div className="text-sm text-muted-foreground">Total Bookings</div>
                        <div className="text-2xl font-bold">{metrics.totalBookings}</div>
                    </div>
                </Card>
                {/* Total Revenue */}
                <Card className="flex items-center p-4">
                    <DollarSign className="hidden sm:block text-primary w-8 h-8" />
                    <div className="ml-3">
                        <div className="text-sm text-muted-foreground">Total Revenue</div>
                        <div className="text-2xl font-bold">{formatCurrency(metrics.totalRevenue)}</div>
                    </div>
                </Card>
                {/* Total Guests */}
                <Card className="flex items-center p-4">
                    <Users className="hidden sm:block text-primary w-8 h-8" />
                    <div className="ml-3">
                        <div className="text-sm text-muted-foreground">Total Guests</div>
                        <div className="text-2xl font-bold">{metrics.totalGuests}</div>
                    </div>
                </Card>
                {/* Overall Rating */}
                <Card className="flex items-center p-4">
                    <Star className="hidden sm:block text-primary w-8 h-8" />
                    <div className="ml-3">
                        <div className="text-sm text-muted-foreground">Overall Rating</div>
                        <div className="text-2xl font-bold">
                            {metrics.averageRating !== null ? metrics.averageRating.toFixed(1) : 'N/A'}
                        </div>
                    </div>
                </Card>
            </div>

            {/* Charts section */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-8">
                {/* Monthly Bookings & Guests (Line Chart) */}
                <Card className="p-4">
                    <h3 className="text-lg font-semibold mb-2">Monthly Bookings vs Guests</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={monthlyData} margin={{ top: 10, right: 20, bottom: 0, left: -10 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" tickLine={false} />
                            <YAxis tickLine={false} />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="bookings" name="Bookings" stroke="#8884d8" strokeWidth={2} dot={{ r: 3 }} />
                            <Line type="monotone" dataKey="guests" name="Guests" stroke="#82ca9d" strokeWidth={2} dot={{ r: 3 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </Card>

                {/* Monthly Revenue (Line Chart) */}
                <Card className="p-4">
                    <h3 className="text-lg font-semibold mb-2">Monthly Revenue</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={monthlyData} margin={{ top: 10, right: 20, bottom: 0, left: -10 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" tickLine={false} />
                            <YAxis tickLine={false} />
                            <Tooltip formatter={(value) => formatCurrency(value)} />
                            <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#ffc658" strokeWidth={2} dot={{ r: 3 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </Card>

                {/* Top 5 Rooms (Bar Chart) – span two columns on XL */}
                <Card className="p-4 xl:col-span-2">
                    <h3 className="text-lg font-semibold mb-2">Top 5 Rooms by Bookings</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart layout="vertical" data={topRoomsData} margin={{ top: 5, right: 20, bottom: 5, left: 40 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" tickLine={false} />
                            <YAxis type="category" dataKey="name" tickLine={false} width={150} />
                            <Tooltip cursor={{ fill: 'rgba(0,0,0,0.1)' }} />
                            <Bar dataKey="count" fill="#69b3f5" name="Bookings" barSize={20} />
                        </BarChart>
                    </ResponsiveContainer>
                </Card>
            </div>

            {/* Upcoming Bookings Table */}
            <h3 className="text-xl font-semibold text-blue-950/70 mb-3">Upcoming Bookings (Today &amp; Tomorrow)</h3>
            <div className="w-full text-left border border-gray-300 rounded-lg max-h-80 overflow-y-auto">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-800 font-medium">
                        <tr>
                            <th className="py-2 px-4 text-left">Guest Name</th>
                            <th className="py-2 px-4 text-left">Room(s)</th>
                            <th className="py-2 px-4 text-center">Total Amount</th>
                            <th className="py-2 px-4 text-center">Status</th>
                        </tr>
                    </thead>
                    <tbody className="text-gray-700">
                        {bookings_today_tomorrow.map((booking) => (
                            <tr key={booking.id} className="border-t border-gray-300">
                                <td className="py-2 px-4">{booking.guest_name}</td>
                                <td className="py-2 px-4 max-sm:hidden">{formatRooms(booking.rooms)}</td>
                                <td className="py-2 px-4 text-center">{formatCurrency(booking.final_price)}</td>
                                <td className="py-2 px-4 text-center">
                                    <StatusBadge status={booking.status} />
                                </td>
                            </tr>
                        ))}
                        {bookings_today_tomorrow.length === 0 && (
                            <tr>
                                <td className="py-2 px-4 text-center text-gray-500" colSpan="4">
                                    No bookings for the next two days.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Dashboard;
