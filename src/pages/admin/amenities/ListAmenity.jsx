import React, { useEffect, useState, useMemo } from 'react';
import Title from '../../../components/Title';
import { Button } from '@/components/ui/button';
import ControlsToolbar from '@/components/admin/common/ControlsToolbar';
import DataTable from '@/components/admin/Table/DataTable';
import { amenityColumns as baseAmenityColumns } from '@/components/admin/Table/amenitiesColumns';
import AmenityFormDialog from '@/components/admin/forms/AmenityFormDialog';
import DeleteDialog from '@/components/common/form/DeleteDialog';
import { toast } from "sonner";
import { useDebounce } from '@/hooks/useDebounce';
import { useAmenitiesApi } from '@/hooks/useAmenitiesApi';

const ListAmenities = () => {
    const amenitiesApi = useAmenitiesApi();

    const [data, setData] = useState([]);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState("");
    const debouncedSearch = useDebounce(search, 400);
    const [sorting, setSorting] = useState([]);
    const [status, setStatus] = useState("all");
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
    const [openDialog, setOpenDialog] = useState(false);
    const [editAmenity, setEditAmenity] = useState(null);
    const [deleteAmenity, setDeleteAmenity] = useState(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    // Dialog handlers
    const handleAdd = () => { setEditAmenity(null); setOpenDialog(true); };
    const handleEdit = (amenity) => { setEditAmenity(amenity); setOpenDialog(true); };
    const handleDeletePrompt = (amenity) => {
        setDeleteAmenity(amenity);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirmed = async () => {
        setDeleteDialogOpen(false);
        if (!deleteAmenity) return;
        setLoading(true);
        try {
            await amenitiesApi.remove(deleteAmenity.id);
            toast.success("Amenity deleted successfully!");
            fetchAmenities();
            setDeleteAmenity(null);
        } catch (error) {
            toast.error("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // Status toggle handler
    const handleStatusToggle = async (amenity) => {
        setLoading(true);
        try {
            await amenitiesApi.updateStatus(amenity.id, amenity.status === "active" ? "inactive" : "active");
            fetchAmenities();
        } catch {
            toast.error("Could not update status.");
        } finally {
            setLoading(false);
        }
    };

    // Columns
    const amenityColumns = useMemo(
        () => baseAmenityColumns({
            onEdit: handleEdit,
            onDelete: handleDeletePrompt,
            onStatusChange: handleStatusToggle,
        }),
        [data, handleEdit, handleDeletePrompt, handleStatusToggle]
    );

    // Fetch amenities from API
    const fetchAmenities = async () => {
        setLoading(true);
        const params = {
            page: pagination.pageIndex + 1,
            per_page: pagination.pageSize,
            sort: sorting[0]
                ? `${sorting[0].id}|${sorting[0].desc ? 'desc' : 'asc'}`
                : 'name|asc',
            search: debouncedSearch,
            status: status === 'all' ? undefined : status,
        };
        try {
            const res = await amenitiesApi.list(params);
            setData(res?.data?.data || []);
            setTotal(res?.data?.meta?.total || 0);
        } catch (e) {
            toast.error("Could not fetch amenities.");
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchAmenities();
        // eslint-disable-next-line
    }, [debouncedSearch, sorting, status, pagination]);

    // Add/Edit Submit handler
    const handleFormSuccess = () => {
        setOpenDialog(false);
        fetchAmenities();
    };

    return (
        <div>
            <Title
                align='left'
                font='outfit'
                title='Amenities'
                subTitle='View, edit, or manage all listed amenities.'
            />
            <div className="flex justify-between items-center mt-4 mb-4">
                <Button onClick={handleAdd} className="cursor-pointer">+ Add Amenity</Button>
            </div>
            <ControlsToolbar
                search={search}
                setSearch={setSearch}
                filters={[{
                    key: "status", label: "Status", value: status, onChange: setStatus,
                    options: [
                        { value: "all", label: "All" },
                        { value: "active", label: "Active" },
                        { value: "inactive", label: "Inactive" },
                    ]
                }]}
            />
            <DataTable
                columns={amenityColumns.map(col =>
                    col.id === "status"
                        ? {
                            ...col,
                            cell: ({ row }) => (
                                <div>
                                    <span>{row.original.status === "active" ? "🟢" : "⚪"}</span>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="ml-2 cursor-pointer"
                                        onClick={() => handleStatusToggle(row.original)}
                                    >
                                        Toggle
                                    </Button>
                                </div>
                            ),
                        }
                        : col
                )}
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
            <AmenityFormDialog
                open={openDialog}
                onOpenChange={setOpenDialog}
                initialData={editAmenity}
                loading={loading}
                isEdit={!!editAmenity}
                onSuccess={handleFormSuccess}
                amenityId={editAmenity?.id}
            />
            <DeleteDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                onConfirm={handleDeleteConfirmed}
                title="Delete Amenity"
                description={`Are you sure you want to delete "${deleteAmenity?.name}"? This action cannot be undone.`}
            />
        </div>
    );
};

export default ListAmenities;
