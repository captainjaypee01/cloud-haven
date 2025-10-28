// pages/admin/room-units/AllBlockedDatesPage.jsx
import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import Title from '../../../components/Title';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import ControlsToolbar from '@/components/admin/common/ControlsToolbar';
import { useApi } from '@/hooks/useApi';
import { API_PREFIX } from '@/constants/api';
import DataTable from '@/components/admin/Table/DataTable';
import BlockedDateFormDialog from '@/components/admin/forms/BlockedDateFormDialog';
import DeleteDialog from '@/components/common/form/DeleteDialog';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from "sonner";
import { useDebounce } from '@/hooks/useDebounce';
import { ArrowLeft, Plus, Calendar, Clock, FileText, ToggleLeft, ToggleRight, Edit, Trash2, BarChart3, Users } from 'lucide-react';

const AllBlockedDatesPage = () => {
    const [data, setData] = useState([]);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState("");
    const debouncedSearch = useDebounce(search, 400);
    const [sorting, setSorting] = useState([]);
    const [activeFilter, setActiveFilter] = useState("all");
    const [roomFilter, setRoomFilter] = useState("all");
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
    const [formDialogOpen, setFormDialogOpen] = useState(false);
    const [editBlockedDate, setEditBlockedDate] = useState(null);
    const [deleteBlockedDate, setDeleteBlockedDate] = useState(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [stats, setStats] = useState(null);
    const [roomUnits, setRoomUnits] = useState([]);
    const [selectedRoomUnitIds, setSelectedRoomUnitIds] = useState([]);
    const api = useApi();
    const isRequestInProgress = useRef(false);

    // Dialog handlers
    const handleAdd = () => {
        setEditBlockedDate(null);
        setFormDialogOpen(true);
    };
    
    const handleBulkAdd = () => {
        if (selectedRoomUnitIds.length === 0) {
            toast.error("Please select at least one room unit");
            return;
        }
        setFormDialogOpen(true);
    };
    
    const handleEdit = (blockedDate) => {
        setEditBlockedDate(blockedDate);
        setFormDialogOpen(true);
    };
    
    const handleDeletePrompt = (blockedDate) => {
        setDeleteBlockedDate(blockedDate);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirmed = async () => {
        setDeleteDialogOpen(false);
        if (!deleteBlockedDate) return;
        setLoading(true);

        try {
            await api.delete(`${API_PREFIX}/admin/room-units/blocked-dates/${deleteBlockedDate.id}`, {
                requiresAuth: true,
            });
            toast.success("Blocked date deleted successfully!");
            fetchBlockedDates();
            fetchStats();
            setDeleteBlockedDate(null);
        } catch (error) {
            toast.error(error.response?.data?.message || "Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleToggleActive = async (blockedDate) => {
        try {
            await api.patch(`${API_PREFIX}/admin/room-units/blocked-dates/${blockedDate.id}/toggle-active`, {}, {
                requiresAuth: true,
            });
            toast.success(`Blocked date ${blockedDate.active ? 'deactivated' : 'activated'} successfully!`);
            fetchBlockedDates();
            fetchStats();
        } catch (error) {
            toast.error(error.response?.data?.message || "Something went wrong. Please try again.");
        }
    };

    const handleDeactivateExpired = async () => {
        try {
            const response = await api.post(`${API_PREFIX}/admin/room-units/blocked-dates/deactivate-expired`, {}, {
                requiresAuth: true,
            });
            toast.success(response.data.message);
            fetchBlockedDates();
            fetchStats();
        } catch (error) {
            toast.error(error.response?.data?.message || "Something went wrong. Please try again.");
        }
    };

    // Table columns
    const blockedDateColumns = useMemo(() => [
        {
            id: "room_unit",
            accessorKey: "room_unit.room.name",
            header: "Room Unit",
            enableSorting: true,
            cell: ({ row }) => {
                const roomUnit = row.original.room_unit;
                return (
                    <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-500" />
                        <div className="flex flex-col">
                            <span className="text-sm font-medium">{roomUnit?.room?.name}</span>
                            <span className="text-xs text-gray-500">Unit {roomUnit?.unit_number}</span>
                        </div>
                    </div>
                );
            },
        },
        {
            id: "date_range",
            accessorKey: "start_date",
            header: "Date Range",
            enableSorting: true,
            cell: ({ row }) => {
                const startDate = new Date(row.original.start_date).toLocaleDateString();
                const endDate = new Date(row.original.end_date).toLocaleDateString();
                return (
                    <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">
                            {startDate === endDate ? startDate : `${startDate} - ${endDate}`}
                        </span>
                    </div>
                );
            },
        },
        {
            id: "expiry_date",
            accessorKey: "expiry_date",
            header: "Expiry Date",
            enableSorting: true,
            cell: ({ row }) => {
                const expiryDate = new Date(row.original.expiry_date);
                const today = new Date();
                const isExpired = expiryDate < today;
                const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
                
                return (
                    <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <div className="flex flex-col">
                            <span className={`text-sm ${isExpired ? 'text-red-600' : daysUntilExpiry <= 7 ? 'text-yellow-600' : 'text-gray-900'}`}>
                                {expiryDate.toLocaleDateString()}
                            </span>
                            {isExpired ? (
                                <span className="text-xs text-red-500">Expired</span>
                            ) : daysUntilExpiry <= 7 ? (
                                <span className="text-xs text-yellow-500">{daysUntilExpiry} days left</span>
                            ) : null}
                        </div>
                    </div>
                );
            },
        },
        {
            id: "active",
            accessorKey: "active",
            header: "Status",
            enableSorting: true,
            cell: ({ row }) => {
                const isActive = row.original.active;
                const isExpired = new Date(row.original.expiry_date) < new Date();
                
                let status = 'inactive';
                let color = 'bg-gray-500';
                
                if (isActive && !isExpired) {
                    status = 'active';
                    color = 'bg-green-500';
                } else if (isExpired) {
                    status = 'expired';
                    color = 'bg-red-500';
                }
                
                return (
                    <Badge className={`${color} text-white`}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                    </Badge>
                );
            },
        },
        {
            id: "notes",
            accessorKey: "notes",
            header: "Notes",
            enableSorting: false,
            cell: ({ row }) => {
                const notes = row.original.notes;
                if (!notes || notes.length === 0) return '—';
                
                const truncated = notes.length > 50 ? notes.substring(0, 50) + '...' : notes;
                return (
                    <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-gray-500" />
                        <span title={notes} className="cursor-help text-sm">
                            {truncated}
                        </span>
                    </div>
                );
            },
        },
        {
            id: "created_at",
            accessorKey: "created_at",
            header: "Created",
            enableSorting: true,
            cell: ({ row }) => {
                if (!row.original.created_at) return '—';
                return new Date(row.original.created_at).toLocaleDateString();
            },
        },
        {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => {
                const isExpired = new Date(row.original.expiry_date) < new Date();
                return (
                    <div className="flex gap-2">
                        <Switch
                            checked={row.original.active}
                            onCheckedChange={() => handleToggleActive(row.original)}
                            disabled={isExpired}
                        />
                        <Button
                            size="sm"
                            variant="secondary"
                            className="cursor-pointer"
                            onClick={() => handleEdit(row.original)}
                        >
                            <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                            size="sm"
                            variant="destructive"
                            className="cursor-pointer"
                            onClick={() => handleDeletePrompt(row.original)}
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </div>
                );
            },
            enableSorting: false,
        }
    ], []);

    // Fetch blocked dates from API
    const fetchBlockedDates = useCallback(async () => {
        if (isRequestInProgress.current) return;

        isRequestInProgress.current = true;
        setLoading(true);

        try {
            const params = {
                search: debouncedSearch,
                active: activeFilter === 'all' ? '' : activeFilter,
                room_id: roomFilter === 'all' ? '' : roomFilter,
                page: pagination.pageIndex + 1,
                per_page: pagination.pageSize,
                sort: sorting[0]
                    ? `${sorting[0].id}|${sorting[0].desc ? 'desc' : 'asc'}`
                    : 'start_date|desc'
            };

            const response = await api.get(`${API_PREFIX}/admin/room-units/blocked-dates/all`, {
                params,
                requiresAuth: true,
            });

            if (response.data?.success) {
                setData(response.data.data.blocked_dates || []);
                setTotal(response.data.data.pagination?.total || 0);
            }
        } catch (error) {
            toast.error("Failed to fetch blocked dates");
        } finally {
            setLoading(false);
            isRequestInProgress.current = false;
        }
    }, [debouncedSearch, activeFilter, roomFilter, pagination.pageIndex, pagination.pageSize, sorting, api]);

    // Fetch statistics
    const fetchStats = useCallback(async () => {
        try {
            const response = await api.get(`${API_PREFIX}/admin/room-units/blocked-dates/stats`, {
                requiresAuth: true,
            });

            if (response.data?.success) {
                setStats(response.data.data);
            }
        } catch (error) {
            console.error("Failed to fetch stats:", error);
        }
    }, [api]);

    // Fetch room units for filters and bulk operations
    const fetchRoomUnits = useCallback(async () => {
        try {
            const response = await api.get(`${API_PREFIX}/admin/room-units`, {
                params: { per_page: 1000 },
                requiresAuth: true,
            });

            if (response.data?.success) {
                setRoomUnits(response.data.data.data || []);
            }
        } catch (error) {
            console.error("Failed to fetch room units:", error);
        }
    }, [api]);

    useEffect(() => {
        fetchBlockedDates();
    }, [fetchBlockedDates]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    useEffect(() => {
        fetchRoomUnits();
    }, [fetchRoomUnits]);

    const activeFilters = [
        { value: "all", label: "All" },
        { value: "true", label: "Active" },
        { value: "false", label: "Inactive" },
    ];

    const roomFilters = [
        { value: "all", label: "All Rooms" },
        ...roomUnits.reduce((acc, unit) => {
            const roomName = unit.room?.name;
            if (roomName && !acc.find(item => item.value === unit.room.id.toString())) {
                acc.push({ value: unit.room.id.toString(), label: roomName });
            }
            return acc;
        }, [])
    ];

    return (
        <div>
            {/* Header with back button */}
            <div className="flex items-center gap-4 mb-6">
                <Link to="/admin/rooms">
                    <Button variant="outline" size="sm" className="cursor-pointer">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Room Units
                    </Button>
                </Link>
            </div>

            <div className="flex items-center gap-4 mb-6">
                <Title
                    align='left'
                    font='outfit'
                    title="All Blocked Dates"
                    subTitle='Manage blocked dates across all room units. Blocked dates prevent bookings during the specified period until they expire.'
                />
            </div>

            {/* Statistics Cards */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total</CardTitle>
                            <BarChart3 className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Active</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Expired</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">{stats.expired}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-yellow-600">{stats.expiring_soon}</div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Room Unit Selection for Bulk Operations */}
            <Card className="mb-4">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        Select Room Units for Bulk Operations
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-40 overflow-y-auto">
                        {roomUnits.map((roomUnit) => (
                            <div key={roomUnit.id} className="flex items-center space-x-2">
                                <Checkbox
                                    id={`room-unit-${roomUnit.id}`}
                                    checked={selectedRoomUnitIds.includes(roomUnit.id)}
                                    onCheckedChange={(checked) => {
                                        if (checked) {
                                            setSelectedRoomUnitIds(prev => [...prev, roomUnit.id]);
                                        } else {
                                            setSelectedRoomUnitIds(prev => prev.filter(id => id !== roomUnit.id));
                                        }
                                    }}
                                />
                                <label
                                    htmlFor={`room-unit-${roomUnit.id}`}
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                >
                                    {roomUnit.room?.name} - {roomUnit.unit_number}
                                </label>
                            </div>
                        ))}
                    </div>
                    {selectedRoomUnitIds.length > 0 && (
                        <div className="mt-3 text-sm text-muted-foreground">
                            {selectedRoomUnitIds.length} room unit(s) selected
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Action buttons */}
            <div className="flex justify-between items-center mb-4">
                <div className="flex gap-2">
                    <Button onClick={handleAdd} className="cursor-pointer">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Blocked Date
                    </Button>
                    <Button onClick={handleBulkAdd} variant="outline" className="cursor-pointer">
                        <Plus className="w-4 h-4 mr-2" />
                        Bulk Add ({selectedRoomUnitIds.length})
                    </Button>
                </div>
                <Button onClick={handleDeactivateExpired} variant="outline" className="cursor-pointer">
                    <Clock className="w-4 h-4 mr-2" />
                    Deactivate Expired
                </Button>
            </div>

            {/* Controls and filters */}
            <ControlsToolbar
                search={search}
                setSearch={setSearch}
                filters={[
                    {
                        key: "active", label: "Status", value: activeFilter, onChange: setActiveFilter,
                        options: activeFilters
                    },
                    {
                        key: "room", label: "Room", value: roomFilter, onChange: setRoomFilter,
                        options: roomFilters
                    }
                ]}
            />

            {/* Data table */}
            <DataTable
                columns={blockedDateColumns}
                data={data}
                pageCount={Math.ceil(total / pagination.pageSize)}
                state={{ pagination, sorting }}
                onPaginationChange={setPagination}
                onSortingChange={setSorting}
                onPageSizeChange={size =>
                    setPagination(prev => ({ ...prev, pageSize: size, pageIndex: 0 }))
                }
                manualPagination={true} // Server-side pagination
                loading={loading}
            />

            {/* Dialogs */}
            <BlockedDateFormDialog
                open={formDialogOpen}
                onOpenChange={setFormDialogOpen}
                initialData={editBlockedDate}
                roomUnits={roomUnits}
                selectedRoomUnitIds={selectedRoomUnitIds}
                isBulk={selectedRoomUnitIds.length > 0 && !editBlockedDate}
                onSuccess={() => {
                    setFormDialogOpen(false);
                    fetchBlockedDates();
                    fetchStats();
                    setEditBlockedDate(null);
                    setSelectedRoomUnitIds([]);
                }}
            />

            <DeleteDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                onConfirm={handleDeleteConfirmed}
                title="Delete Blocked Date"
                description={`Are you sure you want to delete this blocked date? This action cannot be undone.`}
            />
        </div>
    );
};

export default AllBlockedDatesPage;
