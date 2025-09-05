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
import { formatCurrency, formatDate } from '@/lib/format';
import { useNavigate } from 'react-router-dom';
import { useDebounce } from '@/hooks/useDebounce';

const ListBooking = () => {
    const [data, setData] = useState([]);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState("");
    const debouncedSearch = useDebounce(search, 400);
    const [sorting, setSorting] = useState([]);
    const [status, setStatus] = useState("all");
    const [dateFilter, setDateFilter] = useState("");
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
            id: "check_in_date",
            header: "Check-in",
            accessorKey: "check_in_date",
            cell: ({ row }) => formatDate(row.original.check_in_date),
        },
        {
            id: "check_out_date",
            header: "Check-out",
            accessorKey: "check_out_date",
            cell: ({ row }) => formatDate(row.original.check_out_date),
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
                // Calculate the actual total amount including other charges
                const actualFinalPrice = (row.original.final_price || 0) - (row.original.discount_amount || 0);
                const otherCharges = row.original.other_charges || 0;
                const totalAmount = actualFinalPrice + otherCharges;
                return formatCurrency(totalAmount);
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
                <Button
                    size="sm"
                    className="cursor-pointer"
                    variant="secondary"
                    onClick={() => navigate(`/admin/bookings/${row.original.id}`)}
                >
                    View
                </Button>
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
            date: dateFilter || undefined,
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
        fetchBookings({ search: debouncedSearch, status, date: dateFilter });
        // eslint-disable-next-line
    }, [debouncedSearch, sorting, status, dateFilter, pagination]);

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
            </div>
            <ControlsToolbar
                search={search}
                setSearch={setSearch}
                filters={[{
                    key: "status", label: "Status", value: status, onChange: setStatus,
                    options: [
                        { value: "all", label: "All" },
                        { value: "pending", label: "Pending" },
                        { value: "downpayment", label: "Downpayment" },
                        { value: "paid", label: "Paid" },
                        { value: "cancelled", label: "Cancelled" },
                        { value: "failed", label: "Failed" },
                    ]
                }]}
            />
            <div className="mb-4 flex gap-4 items-center">
                <div className="flex flex-col">
                    <label className="text-sm font-medium mb-1">Filter by Date</label>
                    <Input
                        type="date"
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                        className="w-48"
                        placeholder="Select date to filter bookings"
                    />
                </div>
                {dateFilter && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDateFilter("")}
                        className="mt-6"
                    >
                        Clear Date Filter
                    </Button>
                )}
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
