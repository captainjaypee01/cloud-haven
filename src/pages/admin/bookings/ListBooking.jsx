// pages/admin/ListBooking.jsx
import React, { useEffect, useState, useMemo } from 'react';
import Title from '../../../components/Title';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ControlsToolbar from '@/components/admin/common/ControlsToolbar';
import { useApi } from '@/hooks/useApi';
import { API_PREFIX } from '@/constants/api';
import DataTable from '@/components/admin/Table/DataTable';
import { StatusBadge } from '@/components/admin/common/StatusBadge';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/format';
import { useNavigate } from 'react-router-dom';
import { useDebounce } from '@/hooks/useDebounce';

const ListBooking = () => {
    const [data, setData] = useState([]);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState("");
    const debouncedSearch = useDebounce(search, 400);
    const [sorting, setSorting] = useState([]);
    const [status, setStatus] = useState("all");
    const [bookingType, setBookingType] = useState("all");
    const [bookingSource, setBookingSource] = useState("all");
    const [bookingDate, setBookingDate] = useState("");
    const [bookingFromDate, setBookingFromDate] = useState("");
    const [bookingToDate, setBookingToDate] = useState("");
    const [checkinCheckoutDate, setCheckinCheckoutDate] = useState("");
    const [checkinCheckoutFromDate, setCheckinCheckoutFromDate] = useState("");
    const [checkinCheckoutToDate, setCheckinCheckoutToDate] = useState("");
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
    const api = useApi();
    const navigate = useNavigate();

    // Columns for the bookings table
    const bookingColumns = useMemo(() => [
        {
            id: "reference_number",
            header: "Reference #",
            accessorKey: "reference_number",
            cell: ({ row }) => row.original.reference_number,
        },
        {
            id: "guest_name",
            header: "Guest Name",
            accessorKey: "guest_name",
            cell: ({ row }) => row.original.guest_name,
        },
        {
            id: "booking_type",
            header: "Type",
            accessorKey: "booking_type",
            cell: ({ row }) => {
                const type = row.original.booking_type || 'overnight';
                return (
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                        type === 'day_tour' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-green-100 text-green-800'
                    }`}>
                        {type === 'day_tour' ? 'Day Tour' : 'Overnight'}
                    </span>
                );
            },
        },
        {
            id: "booking_source",
            header: "Source",
            accessorKey: "booking_source",
            cell: ({ row }) => {
                const source = row.original.booking_source || 'online';
                return (
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                        source === 'walkin' 
                            ? 'bg-orange-100 text-orange-800' 
                            : 'bg-purple-100 text-purple-800'
                    }`}>
                        {source === 'walkin' ? 'Walk-in' : 'Online'}
                    </span>
                );
            },
        },
        {
            id: "booking_date",
            header: "Booking Date",
            accessorKey: "local_created_at",
            cell: ({ row }) => formatDateTime(row.original.local_created_at),
        },
        {
            id: "stay_details",
            header: "Stay Details",
            accessorKey: "stay_details",
            cell: ({ row }) => {
                const booking = row.original;
                const isDayTour = booking.booking_type === 'day_tour';
                
                if (isDayTour) {
                    return (
                        <div className="text-sm">
                            <div><span className="font-medium">Date:</span> {formatDate(booking.check_in_date)}</div>
                        </div>
                    );
                } else {
                    // Calculate nights for overnight bookings
                    const checkIn = new Date(booking.check_in_date);
                    const checkOut = new Date(booking.check_out_date);
                    const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
                    
                    return (
                        <div className="text-sm">
                            <div><span className="font-medium">Check-in:</span> {formatDate(booking.check_in_date)}</div>
                            <div><span className="font-medium">Check-out:</span> {formatDate(booking.check_out_date)}</div>
                            <div><span className="font-medium">Nights:</span> {nights}</div>
                        </div>
                    );
                }
            },
        },
        {
            id: "total_guests",
            header: "Guests",
            accessorKey: "total_guests",
            cell: ({ row }) => row.original.total_guests,
        },
        {
            id: "rooms",
            header: "Rooms",
            accessorKey: "rooms",
            cell: ({ row }) => row.original.booking_rooms?.length || 0,
        },
        {
            id: "total_payable",
            header: "Total Amount",
            accessorKey: "total_payable",
            cell: ({ row }) => {
                // Use pre-calculated value from API
                return formatCurrency(row.original.total_payable || 0);
            },
        },
        {
            id: "remaining_balance",
            header: "Remaining Balance",
            accessorKey: "remaining_balance",
            cell: ({ row }) => (
                <span className={row.original.remaining_balance > 0 ? "text-red-600 font-semibold" : "text-green-600 font-semibold"}>
                    {formatCurrency(row.original.remaining_balance || 0)}
                </span>
            ),
        },
        {
            id: "status",
            header: "Status",
            accessorKey: "status",
            cell: ({ row }) => <StatusBadge status={row.original.status} />,
        },
        {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => (
                <div className="flex gap-2">
                    <Button
                        size="sm"
                        className="cursor-pointer"
                        variant="secondary"
                        onClick={() => navigate(`/admin/bookings/${row.original.id}`)}
                    >
                        View
                    </Button>
                </div>
            ),
            enableSorting: false,
        }
    ], [navigate]);

    // Fetch bookings from API
    const fetchBookings = async (params = {}) => {
        setLoading(true);
        const merged = {
            ...params,
            page: pagination.pageIndex + 1,
            per_page: pagination.pageSize,
            sort: sorting[0]
                ? `${sorting[0].id}|${sorting[0].desc ? 'desc' : 'asc'}`
                : 'created_at|desc',
            status: status === 'all' ? undefined : status,
            booking_type: bookingType === 'all' ? undefined : bookingType,
            booking_source: bookingSource === 'all' ? undefined : bookingSource,
            created_date: bookingDate || undefined,
            created_from: bookingFromDate || undefined,
            created_to: bookingToDate || undefined,
            date: checkinCheckoutDate || undefined,
            date_from: checkinCheckoutFromDate || undefined,
            date_to: checkinCheckoutToDate || undefined,
        };
        try {
            const res = await api.get(`${API_PREFIX}/admin/bookings`, {
                headers: { "Content-Type": "application/json" },
                params: merged,
                requiresAuth: true,
            });
            setData(res?.data?.data || []);
            setTotal(res?.data?.meta?.total || 0);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBookings({ 
            search: debouncedSearch, 
            status, 
            booking_type: bookingType,
            booking_source: bookingSource,
            created_date: bookingDate,
            created_from: bookingFromDate,
            created_to: bookingToDate,
            date: checkinCheckoutDate,
            date_from: checkinCheckoutFromDate,
            date_to: checkinCheckoutToDate
        });
        // eslint-disable-next-line
    }, [debouncedSearch, sorting, status, bookingType, bookingSource, bookingDate, bookingFromDate, bookingToDate, checkinCheckoutDate, checkinCheckoutFromDate, checkinCheckoutToDate, pagination]);

    return (
        <div>
            <Title
                align='left'
                font='outfit'
                title='Booking Listings'
                subTitle='View and manage all resort bookings.'
            />
            <p className='text-gray-500 mt-8'>All Bookings</p>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Bookings</h2>
                <Button
                    onClick={() => navigate('/admin/bookings/walk-in')}
                    className="bg-green-600 hover:bg-green-700"
                >
                    Create Walk-In Booking
                </Button>
            </div>
            <ControlsToolbar
                search={search}
                setSearch={setSearch}
                filters={[
                    {
                        key: "status", label: "Status", value: status, onChange: setStatus,
                        options: [
                            { value: "all", label: "All" },
                            { value: "pending", label: "Pending" },
                            { value: "downpayment", label: "Downpayment" },
                            { value: "paid", label: "Paid" },
                            { value: "cancelled", label: "Cancelled" },
                            { value: "failed", label: "Failed" },
                        ]
                    },
                    {
                        key: "booking_type", label: "Type", value: bookingType, onChange: setBookingType,
                        options: [
                            { value: "all", label: "All" },
                            { value: "overnight", label: "Overnight" },
                            { value: "day_tour", label: "Day Tour" },
                        ]
                    },
                    {
                        key: "booking_source", label: "Source", value: bookingSource, onChange: setBookingSource,
                        options: [
                            { value: "all", label: "All" },
                            { value: "online", label: "Online" },
                            { value: "walkin", label: "Walk-in" },
                        ]
                    }
                ]}
            />
            <div className="mb-4 space-y-4">
                {/* Date Filters - Responsive layout */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {/* Booking Creation Date Filters */}
                    <div className="space-y-2">
                        <h4 className="text-sm font-semibold text-gray-700">Filter by Booking Creation Date</h4>
                        <div className="space-y-3">
                            <div className="flex flex-col space-y-2">
                                <label className="text-sm font-medium">Date Range</label>
                                <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                                    <Input
                                        type="date"
                                        value={bookingFromDate}
                                        onChange={(e) => setBookingFromDate(e.target.value)}
                                        className="w-full sm:w-36"
                                        placeholder="From date"
                                    />
                                    <span className="text-gray-500 text-sm hidden sm:inline">to</span>
                                    <span className="text-gray-500 text-sm sm:hidden">to</span>
                                    <Input
                                        type="date"
                                        value={bookingToDate}
                                        onChange={(e) => setBookingToDate(e.target.value)}
                                        className="w-full sm:w-36"
                                        placeholder="To date"
                                    />
                                </div>
                            </div>
                            <div className="flex flex-col space-y-2">
                                <label className="text-sm font-medium">Or specific date</label>
                                <Input
                                    type="date"
                                    value={bookingDate}
                                    onChange={(e) => setBookingDate(e.target.value)}
                                    className="w-full sm:w-36"
                                    placeholder="Select date"
                                />
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                setBookingFromDate("");
                                setBookingToDate("");
                                setBookingDate("");
                            }}
                            className="text-xs w-full sm:w-auto"
                        >
                            Clear Booking Date
                        </Button>
                    </div>

                    {/* Check-in/Check-out Date Filters */}
                    <div className="space-y-2">
                        <h4 className="text-sm font-semibold text-gray-700">Filter by Check-in/Check-out Date</h4>
                        <div className="space-y-3">
                            <div className="flex flex-col space-y-2">
                                <label className="text-sm font-medium">Date Range</label>
                                <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                                    <Input
                                        type="date"
                                        value={checkinCheckoutFromDate}
                                        onChange={(e) => setCheckinCheckoutFromDate(e.target.value)}
                                        className="w-full sm:w-36"
                                        placeholder="From date"
                                    />
                                    <span className="text-gray-500 text-sm hidden sm:inline">to</span>
                                    <span className="text-gray-500 text-sm sm:hidden">to</span>
                                    <Input
                                        type="date"
                                        value={checkinCheckoutToDate}
                                        onChange={(e) => setCheckinCheckoutToDate(e.target.value)}
                                        className="w-full sm:w-36"
                                        placeholder="To date"
                                    />
                                </div>
                            </div>
                            <div className="flex flex-col space-y-2">
                                <label className="text-sm font-medium">Or specific date</label>
                                <Input
                                    type="date"
                                    value={checkinCheckoutDate}
                                    onChange={(e) => setCheckinCheckoutDate(e.target.value)}
                                    className="w-full sm:w-36"
                                    placeholder="Select date"
                                />
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                setCheckinCheckoutFromDate("");
                                setCheckinCheckoutToDate("");
                                setCheckinCheckoutDate("");
                            }}
                            className="text-xs w-full sm:w-auto"
                        >
                            Clear Check-in/Check-out Date
                        </Button>
                    </div>
                </div>

                {/* Clear All Filters */}
                <div className="flex justify-center sm:justify-end">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            setBookingDate("");
                            setBookingFromDate("");
                            setBookingToDate("");
                            setCheckinCheckoutDate("");
                            setCheckinCheckoutFromDate("");
                            setCheckinCheckoutToDate("");
                            setBookingType("all");
                            setBookingSource("all");
                            setStatus("all");
                        }}
                        className="text-red-600 hover:text-red-700 w-full sm:w-auto"
                    >
                        Clear All Filters
                    </Button>
                </div>
            </div>
            <DataTable
                columns={bookingColumns}
                data={data}
                pageCount={Math.ceil(total / pagination.pageSize)}
                state={{ pagination, sorting }}
                onPaginationChange={setPagination}
                onSortingChange={setSorting}
                onPageSizeChange={size =>
                    setPagination(prev => ({ ...prev, pageSize: size, pageIndex: 0 }))
                }
                manualPagination={true}
                loading={loading}
            />
        </div>
    );
};

export default ListBooking;
