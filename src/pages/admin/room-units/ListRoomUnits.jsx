// pages/admin/room-units/ListRoomUnits.jsx
import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import Title from '../../../components/Title';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import ControlsToolbar from '@/components/admin/common/ControlsToolbar';
import { useApi } from '@/hooks/useApi';
import { API_PREFIX } from '@/constants/api';
import DataTable from '@/components/admin/Table/DataTable';
import { roomUnitColumns as baseRoomUnitColumns } from '@/components/admin/Table/roomUnitColumns';
import GenerateUnitsDialog from '@/components/admin/forms/GenerateUnitsDialog';
import RoomUnitFormDialog from '@/components/admin/forms/RoomUnitFormDialog';
import BlockedDateFormDialog from '@/components/admin/forms/BlockedDateFormDialog';
import { toast } from "sonner";
import { useDebounce } from '@/hooks/useDebounce';
import { ArrowLeft, Plus, BarChart3, Calendar, CalendarDays } from 'lucide-react';
import { Link } from 'react-router-dom';
import DeleteDialog from '@/components/common/form/DeleteDialog';
import { Checkbox } from '@/components/ui/checkbox';

const ListRoomUnits = () => {
    const { roomId } = useParams();
    const [room, setRoom] = useState(null);
    const [stats, setStats] = useState(null);
    const [data, setData] = useState([]);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState("");
    const debouncedSearch = useDebounce(search, 400);
    const [sorting, setSorting] = useState([]);
    const [status, setStatus] = useState("all");
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
    const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [editUnit, setEditUnit] = useState(null);
    const [deleteUnit, setDeleteUnit] = useState(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedRoomUnitIds, setSelectedRoomUnitIds] = useState([]);
    const [rowSelection, setRowSelection] = useState({});
    
    // Debug: Log when selectedRoomUnitIds changes
    useEffect(() => {
        console.log('selectedRoomUnitIds state changed:', selectedRoomUnitIds);
    }, [selectedRoomUnitIds]);
    const [bulkBlockedDateDialogOpen, setBulkBlockedDateDialogOpen] = useState(false);
    const api = useApi();
    const isRequestInProgress = useRef(false);

    // Dialog handlers
    const handleGenerate = () => setGenerateDialogOpen(true);
    const handleEdit = (unit) => {
        setEditUnit(unit);
        setEditDialogOpen(true);
    };
    const handleDeletePrompt = (unit) => {
        setDeleteUnit(unit);
        setDeleteDialogOpen(true);
    };

    const handleRowSelectionChange = useCallback((updaterOrValue) => {
        console.log('handleRowSelectionChange called with:', updaterOrValue);
        
        // Handle both function and direct value updates
        const newRowSelection = typeof updaterOrValue === 'function' 
            ? updaterOrValue(rowSelection) 
            : updaterOrValue;
            
        console.log('newRowSelection:', newRowSelection);
        setRowSelection(newRowSelection);
        
        const selectedIds = Object.keys(newRowSelection).filter(key => newRowSelection[key]);
        console.log('selectedIds:', selectedIds);
        
        const parsedIds = selectedIds.map(id => parseInt(id));
        console.log('parsedIds:', parsedIds);
        
        setSelectedRoomUnitIds(parsedIds);
        console.log('selectedRoomUnitIds state will be:', parsedIds);
    }, [rowSelection]);

    const handleBulkBlockedDates = () => {
        console.log('handleBulkBlockedDates called, selectedRoomUnitIds:', selectedRoomUnitIds);
        console.log('selectedRoomUnitIds.length:', selectedRoomUnitIds.length);
        
        if (selectedRoomUnitIds.length === 0) {
            toast.error("Please select at least one room unit");
            return;
        }
        setBulkBlockedDateDialogOpen(true);
    };

    const handleDeleteConfirmed = async () => {
        setDeleteDialogOpen(false);
        if (!deleteUnit) return;
        setLoading(true);

        try {
            await api.delete(`${API_PREFIX}/admin/room-units/${deleteUnit.id}`, {
                requiresAuth: true,
            });
            toast.success("Room unit deleted successfully!");
            fetchRoomUnits();
            fetchRoomStats();
            setDeleteUnit(null);
        } catch (error) {
            toast.error(error.response?.data?.message || "Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };



    // Actions column
    const roomUnitColumns = useMemo(() => [
        {
            id: "select",
            header: ({ table }) => (
                <Checkbox
                    checked={
                        table.getIsAllPageRowsSelected() ||
                        (table.getIsSomePageRowsSelected() && "indeterminate")
                    }
                    onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                    aria-label="Select all"
                />
            ),
            cell: ({ row }) => (
                <Checkbox
                    checked={row.getIsSelected()}
                    onCheckedChange={(value) => row.toggleSelected(!!value)}
                    aria-label="Select row"
                />
            ),
            enableSorting: false,
            enableHiding: false,
        },
        ...baseRoomUnitColumns.filter(col => col.id !== "actions"),
        {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => (
                <div className="flex gap-2">
                    <Link to={`/admin/room-units/${row.original.id}/blocked-dates`}>
                        <Button
                            size="sm"
                            variant="outline"
                            className="cursor-pointer"
                        >
                            <CalendarDays className="w-4 h-4" />
                        </Button>
                    </Link>
                    <Button
                        size="sm"
                        variant="secondary"
                        className="cursor-pointer"
                        onClick={() => handleEdit(row.original)}
                    >
                        Edit
                    </Button>
                    <Button
                        size="sm"
                        variant="destructive"
                        className="cursor-pointer"
                        onClick={() => handleDeletePrompt(row.original)}
                    >
                        Delete
                    </Button>
                </div>
            ),
            enableSorting: false,
        }
    ], [baseRoomUnitColumns]);

    // Fetch room units from API
    const fetchRoomUnits = useCallback(async () => {
        if (!roomId || isRequestInProgress.current) return;

        isRequestInProgress.current = true;
        setLoading(true);

        try {
            const params = {
                search: debouncedSearch,
                status,
                page: pagination.pageIndex + 1,
                per_page: pagination.pageSize,
                sort: sorting[0]
                    ? `${sorting[0].id}|${sorting[0].desc ? 'desc' : 'asc'}`
                    : 'unit_number|asc'
            };

            const response = await api.get(`${API_PREFIX}/admin/room-types/${roomId}/units`, {
                params,
                requiresAuth: true,
            });

            if (response.data?.success) {
                setRoom(response.data.data.room);
                setData(response.data.data.units || []);
                setTotal(response.data.data.pagination?.total || 0);
            }
        } catch (error) {
            toast.error("Failed to fetch room units");
        } finally {
            setLoading(false);
            isRequestInProgress.current = false;
        }
    }, [roomId, debouncedSearch, status, pagination.pageIndex, pagination.pageSize, sorting, api]);

    // Fetch room statistics from API
    const fetchRoomStats = useCallback(async () => {
        if (!roomId) return;

        try {
            const response = await api.get(`${API_PREFIX}/admin/room-types/${roomId}/stats`, {
                requiresAuth: true,
            });

            if (response.data?.success) {
                setStats(response.data.data.stats);
            }
        } catch (error) {
            console.error("Failed to fetch room stats:", error);
        }
    }, [roomId, api]);

    useEffect(() => {
        fetchRoomUnits();
    }, [fetchRoomUnits]);
    useEffect(() => {
        fetchRoomStats();
    }, [fetchRoomStats]);

    const statusFilters = [
        { value: "all", label: "All" },
        { value: "available", label: "Available" },
        { value: "occupied", label: "Currently Booked" },
        { value: "maintenance", label: "Maintenance" },
        { value: "blocked", label: "Blocked" },
    ];

    return (
        <div>
            {/* Header with back button */}
            <div className="flex items-center gap-4 mb-6">
                <Link to="/admin/rooms">
                    <Button variant="outline" size="sm" className="cursor-pointer">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Rooms
                    </Button>
                </Link>
            </div>

            <div className="flex items-center gap-4 mb-6">
                <Title
                    align='left'
                    font='outfit'
                    title={`Room Units - ${room?.name || 'Loading...'}`}
                    subTitle='Manage individual room units and their assignments. Available: Units ready for booking | Currently Booked: Count of active/upcoming bookings | Maintenance: Temporarily unavailable | Blocked: Manually blocked.'
                />
            </div>

            {/* Statistics Cards */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Units</CardTitle>
                            <BarChart3 className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Available</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">{stats.available}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Currently Booked</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-600">{stats.occupied}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Maintenance</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-yellow-600">{stats.maintenance}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Blocked</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">{stats.blocked}</div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Action buttons */}
            <div className="flex justify-between items-center mb-4">
                <div className="flex gap-2">
                    <Button onClick={handleGenerate} className="cursor-pointer">
                        <Plus className="w-4 h-4 mr-2" />
                        Generate Units
                    </Button>
                    <Link to={`/admin/room-units/${roomId}/calendar`}>
                        <Button variant="outline" className="cursor-pointer">
                            <Calendar className="w-4 h-4 mr-2" />
                            Calendar View
                        </Button>
                    </Link>
                    <Button onClick={handleBulkBlockedDates} variant="outline" className="cursor-pointer">
                        <CalendarDays className="w-4 h-4 mr-2" />
                        Bulk Blocked Dates ({selectedRoomUnitIds.length})
                    </Button>
                </div>
                <Link to="/admin/room-units/blocked-dates">
                    <Button variant="outline" className="cursor-pointer">
                        <CalendarDays className="w-4 h-4 mr-2" />
                        All Blocked Dates
                    </Button>
                </Link>
            </div>

            {/* Controls and filters */}
            <ControlsToolbar
                search={search}
                setSearch={setSearch}
                filters={[{
                    key: "status", label: "Status", value: status, onChange: setStatus,
                    options: statusFilters
                }]}
            />

            {/* Data table */}
            {console.log('DataTable data:', data)}
            {console.log('DataTable selectedRoomUnitIds:', selectedRoomUnitIds)}
            <DataTable
                columns={roomUnitColumns}
                data={data}
                pageCount={Math.ceil(total / pagination.pageSize)}
                state={{ pagination, sorting, rowSelection }}
                onPaginationChange={setPagination}
                onSortingChange={setSorting}
                onPageSizeChange={size =>
                    setPagination(prev => ({ ...prev, pageSize: size, pageIndex: 0 }))
                }
                manualPagination={true} // Server-side pagination
                loading={loading}
                enableRowSelection={true}
                onRowSelectionChange={handleRowSelectionChange}
                getRowId={(row) => row.id.toString()}
            />

            {/* Dialogs */}
            <GenerateUnitsDialog
                open={generateDialogOpen}
                onOpenChange={setGenerateDialogOpen}
                room={room}
                onSuccess={() => {
                    setGenerateDialogOpen(false);
                    fetchRoomUnits();
                    fetchRoomStats();
                }}
            />

            <RoomUnitFormDialog
                open={editDialogOpen}
                onOpenChange={setEditDialogOpen}
                initialData={editUnit}
                onSuccess={() => {
                    setEditDialogOpen(false);
                    fetchRoomUnits();
                    fetchRoomStats();
                    setEditUnit(null);
                }}
            />

            <BlockedDateFormDialog
                open={bulkBlockedDateDialogOpen}
                onOpenChange={setBulkBlockedDateDialogOpen}
                roomUnits={data}
                selectedRoomUnitIds={selectedRoomUnitIds}
                isBulk={true}
                onSuccess={() => {
                    setBulkBlockedDateDialogOpen(false);
                    fetchRoomUnits();
                    fetchRoomStats();
                    setSelectedRoomUnitIds([]);
                }}
            />

            <DeleteDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                onConfirm={handleDeleteConfirmed}
                title="Delete Room Unit"
                description={`Are you sure you want to delete room unit "${deleteUnit?.unit_number}"? This action cannot be undone.`}
            />
        </div>
    );
};

export default ListRoomUnits;
