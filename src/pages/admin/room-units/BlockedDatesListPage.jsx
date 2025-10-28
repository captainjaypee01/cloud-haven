// pages/admin/room-units/BlockedDatesListPage.jsx
import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
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
import { toast } from "sonner";
import { useDebounce } from '@/hooks/useDebounce';
import { ArrowLeft, Plus, Calendar, Clock, FileText, ToggleLeft, ToggleRight, Edit, Trash2 } from 'lucide-react';

const BlockedDatesListPage = () => {
    const { roomUnitId } = useParams();
    const [roomUnit, setRoomUnit] = useState(null);
    const [data, setData] = useState([]);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState("");
    const debouncedSearch = useDebounce(search, 400);
    const [sorting, setSorting] = useState([]);
    const [activeFilter, setActiveFilter] = useState("all");
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
    const [formDialogOpen, setFormDialogOpen] = useState(false);
    const [editBlockedDate, setEditBlockedDate] = useState(null);
    const [deleteBlockedDate, setDeleteBlockedDate] = useState(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const api = useApi();
    const isRequestInProgress = useRef(false);

    // Dialog handlers
    const handleAdd = () => {
        setEditBlockedDate(null);
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
        } catch (error) {
            toast.error(error.response?.data?.message || "Something went wrong. Please try again.");
        }
    };

    // Table columns
    const blockedDateColumns = useMemo(() => [
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
        if (!roomUnitId || isRequestInProgress.current) return;

        isRequestInProgress.current = true;
        setLoading(true);

        try {
            const params = {
                search: debouncedSearch,
                active: activeFilter === 'all' ? '' : activeFilter,
                page: pagination.pageIndex + 1,
                per_page: pagination.pageSize,
                sort: sorting[0]
                    ? `${sorting[0].id}|${sorting[0].desc ? 'desc' : 'asc'}`
                    : 'start_date|desc'
            };

            const response = await api.get(`${API_PREFIX}/admin/room-units/${roomUnitId}/blocked-dates`, {
                params,
                requiresAuth: true,
            });

            if (response.data?.success) {
                setRoomUnit(response.data.data.room_unit);
                setData(response.data.data.blocked_dates || []);
                setTotal(response.data.data.pagination?.total || 0);
            }
        } catch (error) {
            toast.error("Failed to fetch blocked dates");
        } finally {
            setLoading(false);
            isRequestInProgress.current = false;
        }
    }, [roomUnitId, debouncedSearch, activeFilter, pagination.pageIndex, pagination.pageSize, sorting, api]);

    useEffect(() => {
        fetchBlockedDates();
    }, [fetchBlockedDates]);

    const activeFilters = [
        { value: "all", label: "All" },
        { value: "true", label: "Active" },
        { value: "false", label: "Inactive" },
    ];

    return (
        <div>
            {/* Header with back button */}
            <div className="flex items-center gap-4 mb-6">
                <Link to={`/admin/room-units/${roomUnit?.room_id}`}>
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
                    title={`Blocked Dates - ${roomUnit?.room?.name || 'Loading...'} - Unit ${roomUnit?.unit_number || ''}`}
                    subTitle='Manage blocked dates for this room unit. Blocked dates prevent bookings during the specified period until they expire.'
                />
            </div>

            {/* Action buttons */}
            <div className="flex justify-between items-center mb-4">
                <Button onClick={handleAdd} className="cursor-pointer">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Blocked Date
                </Button>
            </div>

            {/* Controls and filters */}
            <ControlsToolbar
                search={search}
                setSearch={setSearch}
                filters={[{
                    key: "active", label: "Status", value: activeFilter, onChange: setActiveFilter,
                    options: activeFilters
                }]}
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
                roomUnits={roomUnit ? [roomUnit] : []}
                onSuccess={() => {
                    setFormDialogOpen(false);
                    fetchBlockedDates();
                    setEditBlockedDate(null);
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

export default BlockedDatesListPage;
