import React, { useEffect, useState } from 'react';
import { useApi } from '@/hooks/useApi';
import { API_PREFIX } from '@/constants/api';
import Title from '@/components/Title';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/admin/common/StatusBadge';
import { formatCurrency, formatDate } from '@/lib/format';
import { Users, CalendarCheck, DollarSign, Star, Calendar, Eye } from 'lucide-react';  // example icons
import { useNavigate } from 'react-router-dom';
import RoomUnitCalendar from '@/components/admin/calendar/RoomUnitCalendar';
import { useUser } from '@clerk/clerk-react';
// Recharts components
import { ResponsiveContainer, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';

const Dashboard = () => {
    const api = useApi();
    const navigate = useNavigate();
    const { user } = useUser();
    const userRole = user?.publicMetadata?.role || 'user';
    
    const [dashboardData, setDashboardData] = useState({
        metrics: { totalBookings: 0, totalRevenue: 0, totalGuests: 0, averageRating: null },
        top_rooms: [],
        monthly_stats: [],
        bookings_today_tomorrow: [],
        booking_status_distribution: [],
        payment_status_distribution: [],
        occupancy_trends: []
    });

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const res = await api.get(`${API_PREFIX}/admin/dashboard`, { requiresAuth: true });
                if (res.data) {
                    setDashboardData(res.data);
                }
            } catch (err) {
                console.error('Failed to load dashboard data', err);
            }
        };
        fetchDashboard();
    }, [api]);

    const { metrics, top_rooms, monthly_stats, bookings_today_tomorrow, booking_status_distribution, payment_status_distribution, occupancy_trends } = dashboardData;

    // Prepare data for charts with proper null checks
    const topRoomsData = top_rooms || [];  // [{ name, count }, ...]
    const monthlyData = monthly_stats || [];  // [{ month, bookings, guests, revenue }, ...]
    const bookingStatusData = booking_status_distribution || [];
    const paymentStatusData = payment_status_distribution || [];
    const occupancyData = occupancy_trends || [];

    // Color schemes for charts
    const COLORS = {
        primary: '#3b82f6',
        secondary: '#10b981',
        accent: '#f59e0b',
        danger: '#ef4444',
        warning: '#f97316',
        info: '#06b6d4',
        success: '#22c55e',
        purple: '#8b5cf6',
        pink: '#ec4899'
    };

    const PIE_COLORS = [COLORS.primary, COLORS.secondary, COLORS.accent, COLORS.danger, COLORS.warning, COLORS.info, COLORS.success, COLORS.purple];

    // Helper to display room info (if multiple rooms in a booking)
    const formatRooms = (roomsArr) => {
        if (!roomsArr || roomsArr.length === 0) return '';
        if (roomsArr.length === 1) return roomsArr[0];
        // If multiple, show first room + "+X more"
        return `${roomsArr[0]} + ${roomsArr.length - 1} more`;
    };

    // Navigation handlers
    const handleViewToday = () => {
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
        navigate(`/admin/bookings/calendar?date=${today}`);
    };

    const handleViewMonth = () => {
        const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
        navigate(`/admin/bookings/calendar?month=${currentMonth}`);
    };

    const handleViewBookingDetails = (bookingId) => {
        navigate(`/admin/bookings/${bookingId}`);
    };

    // Determine what content to show based on user role
    const isStaff = userRole === 'staff';
    const isAdmin = userRole === 'admin';
    const isSuperAdmin = userRole === 'superadmin';

    return (
        <div className="p-4">
            {/* Page title */}
            <Title
                align="left"
                font="outfit"
                title="Dashboard"
                subTitle={
                    isStaff 
                        ? "Monitor upcoming bookings and room availability for today and tomorrow."
                        : "Monitor your room listings, track bookings, and analyze revenue — all in one place. Stay updated with real-time insights to ensure smooth operations."
                }
            />

            {/* Overview metric cards - Only show for Admin and Superadmin */}
            {!isStaff && (
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
            )}
            {/* Upcoming Bookings Table */}
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-xl font-semibold text-blue-950/70">Upcoming Bookings (Today &amp; Tomorrow)</h3>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleViewToday}
                        className="flex items-center gap-2"
                    >
                        <Calendar className="w-4 h-4" />
                        View Today
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleViewMonth}
                        className="flex items-center gap-2"
                    >
                        <CalendarCheck className="w-4 h-4" />
                        View Month
                    </Button>
                </div>
            </div>
            <div className="w-full text-left border border-gray-300 rounded-lg max-h-80 overflow-y-auto">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-800 font-medium">
                        <tr>
                            <th className="py-2 px-4 text-left">Guest Name</th>
                            <th className="py-2 px-4 text-left">Check-in</th>
                            <th className="py-2 px-4 text-left">Check-out</th>
                            <th className="py-2 px-4 text-left">Room(s)</th>
                            <th className="py-2 px-4 text-center">Total Amount</th>
                            <th className="py-2 px-4 text-center">Remaining Balance</th>
                            <th className="py-2 px-4 text-center">Status</th>
                            <th className="py-2 px-4 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="text-gray-700">
                        {(bookings_today_tomorrow || []).map((booking) => {

                            const totalPaid = booking.payments?.filter(p => p.status === 'paid').reduce((sum, p) => sum + Number(p.amount || 0), 0) || 0;

                            // Remaining balance = (final price + other charges) - total paid (never negative)
                            const totalPayable = Number(booking.final_price) + Number(booking.other_charges);
                            const remainingBalance = Math.max(booking.final_price - totalPaid, 0);
                            return (
                                <tr key={booking.id} className="border-t border-gray-300">
                                    <td className="py-2 px-4">{booking.guest_name}</td>
                                    <td className="py-2 px-4">{formatDate(booking.check_in_date)}</td>
                                    <td className="py-2 px-4">{formatDate(booking.check_out_date)}</td>
                                    <td className="py-2 px-4 max-sm:hidden">{formatRooms(booking.rooms)}</td>
                                    <td className="py-2 px-4 text-center">{formatCurrency(totalPayable)}</td>
                                    <td className="py-2 px-4 text-center">{formatCurrency(remainingBalance)}</td>
                                    <td className="py-2 px-4 text-center">
                                        <StatusBadge status={booking.status} />
                                    </td>
                                    <td className="py-2 px-4 text-center">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleViewBookingDetails(booking.id)}
                                            className="flex items-center gap-1"
                                        >
                                            <Eye className="w-4 h-4" />
                                            View
                                        </Button>
                                    </td>
                                </tr>
                            )
                        }
                        )}
                        {(bookings_today_tomorrow || []).length === 0 && (
                            <tr>
                                <td className="py-2 px-4 text-center text-gray-500" colSpan="8">
                                    No bookings for the next two days.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Room Unit Calendar - Show for all roles */}
            <div className="mt-8">
                <RoomUnitCalendar />
            </div>

            {/* Charts section - Only show for Admin and Superadmin */}
            {!isStaff && (
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
                                <Line type="monotone" dataKey="bookings" name="Bookings" stroke={COLORS.primary} strokeWidth={2} dot={{ r: 3 }} />
                                <Line type="monotone" dataKey="guests" name="Guests" stroke={COLORS.secondary} strokeWidth={2} dot={{ r: 3 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </Card>

                    {/* Monthly Revenue (Line Chart) */}
                    <Card className="p-4">
                        <h3 className="text-lg font-semibold mb-2">Monthly Revenue</h3>
                        <ResponsiveContainer width="100%" height={250}>
                            <LineChart data={monthlyData} margin={{ top: 10, right: 20, bottom: 0, left: 60 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month" tickLine={false} />
                                <YAxis
                                    tickLine={false}
                                    tickFormatter={(value) => {
                                        if (value >= 1000000) {
                                            return `₱${(value / 1000000).toFixed(1)}M`;
                                        } else if (value >= 1000) {
                                            return `₱${(value / 1000).toFixed(0)}K`;
                                        }
                                        return `₱${value}`;
                                    }}
                                    width={60}
                                />
                                <Tooltip
                                    formatter={(value) => [formatCurrency(value), 'Revenue']}
                                    labelFormatter={(label) => `Month: ${label}`}
                                />
                                <Line type="monotone" dataKey="revenue" name="Revenue" stroke={COLORS.accent} strokeWidth={2} dot={{ r: 2 }} />
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
                                <Bar dataKey="count" fill={COLORS.info} name="Bookings" barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </Card>
                </div>
            )}


            {/* Additional Analytics Charts - Only show for Admin and Superadmin */}
            {!isStaff && (bookingStatusData.length > 0 || paymentStatusData.length > 0 || occupancyData.length > 0) && (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
                    {/* Booking Status Distribution (Pie Chart) */}
                    {bookingStatusData.length > 0 && (
                        <Card className="p-4">
                            <h3 className="text-lg font-semibold mb-2">Booking Status Distribution</h3>
                            <ResponsiveContainer width="100%" height={250}>
                                <PieChart>
                                    <Pie
                                        data={bookingStatusData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {bookingStatusData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </Card>
                    )}

                    {/* Payment Status Distribution (Pie Chart) */}
                    {paymentStatusData.length > 0 && (
                        <Card className="p-4">
                            <h3 className="text-lg font-semibold mb-2">Payment Status Distribution</h3>
                            <ResponsiveContainer width="100%" height={250}>
                                <PieChart>
                                    <Pie
                                        data={paymentStatusData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {paymentStatusData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </Card>
                    )}

                    {/* Occupancy Rate Trends (Area Chart) */}
                    {occupancyData.length > 0 && (
                        <Card className="p-4">
                            <h3 className="text-lg font-semibold mb-2">Occupancy Rate Trends</h3>
                            <ResponsiveContainer width="100%" height={250}>
                                <AreaChart data={occupancyData} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="month" tickLine={false} />
                                    <YAxis
                                        tickLine={false}
                                        domain={[0, 100]}
                                        tickFormatter={(value) => `${value}%`}
                                    />
                                    <Tooltip
                                        formatter={(value) => [`${value}%`, 'Occupancy Rate']}
                                        labelFormatter={(label) => `Month: ${label}`}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="occupancy_rate"
                                        stroke={COLORS.primary}
                                        fill={COLORS.primary}
                                        fillOpacity={0.3}
                                        strokeWidth={2}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </Card>
                    )}
                </div>
            )}

            {/* Revenue vs Expenses Comparison (if data available) - Only show for Admin and Superadmin */}
            {!isStaff && monthlyData.some(item => item.expenses !== undefined) && (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-8">
                    <Card className="p-4">
                        <h3 className="text-lg font-semibold mb-2">Revenue vs Expenses</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={monthlyData} margin={{ top: 10, right: 20, bottom: 0, left: 60 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month" tickLine={false} />
                                <YAxis
                                    tickLine={false}
                                    tickFormatter={(value) => {
                                        if (value >= 1000000) {
                                            return `₱${(value / 1000000).toFixed(1)}M`;
                                        } else if (value >= 1000) {
                                            return `₱${(value / 1000).toFixed(0)}K`;
                                        }
                                        return `₱${value}`;
                                    }}
                                    width={60}
                                />
                                <Tooltip
                                    formatter={(value) => [formatCurrency(value), '']}
                                    labelFormatter={(label) => `Month: ${label}`}
                                />
                                <Legend />
                                <Bar dataKey="revenue" name="Revenue" fill={COLORS.success} />
                                <Bar dataKey="expenses" name="Expenses" fill={COLORS.danger} />
                            </BarChart>
                        </ResponsiveContainer>
                    </Card>

                    <Card className="p-4">
                        <h3 className="text-lg font-semibold mb-2">Profit Margin Trend</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={monthlyData} margin={{ top: 10, right: 20, bottom: 0, left: 60 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month" tickLine={false} />
                                <YAxis
                                    tickLine={false}
                                    tickFormatter={(value) => `${value}%`}
                                    domain={[0, 100]}
                                />
                                <Tooltip
                                    formatter={(value) => [`${value}%`, 'Profit Margin']}
                                    labelFormatter={(label) => `Month: ${label}`}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="profit_margin"
                                    name="Profit Margin"
                                    stroke={COLORS.accent}
                                    strokeWidth={3}
                                    dot={{ r: 4 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </Card>
                </div>
            )}


        </div>
    );
};

export default Dashboard;
