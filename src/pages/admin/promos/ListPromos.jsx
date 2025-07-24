// src/pages/admin/promos/ListPromos.jsx
import React, { useEffect, useState, useMemo } from 'react';
import Title from '@/components/Title';
import { Button } from '@/components/ui/button';
import ControlsToolbar from '@/components/admin/common/ControlsToolbar';
import DataTable from '@/components/admin/Table/DataTable';
import { promoColumns as basePromoColumns } from '@/components/admin/Table/promoColumns';
import PromoFormDialog from '@/components/admin/forms/PromoFormDialog';
import DeleteDialog from '@/components/common/form/DeleteDialog';
import { toast } from 'sonner';
import { usePromosApi } from '@/hooks/api/usePromosApi';

const ListPromos = () => {
    const promosApi = usePromosApi();

    const [data, setData] = useState([]);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [sorting, setSorting] = useState([]);
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
    const [loading, setLoading] = useState(false);

    // Selection and dialogs state
    const [selectedIds, setSelectedIds] = useState([]);
    const [openForm, setOpenForm] = useState(false);
    const [editPromo, setEditPromo] = useState(null);
    const [deletePromo, setDeletePromo] = useState(null);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

    // Handlers for opening dialogs
    const handleAdd = () => { setEditPromo(null); setOpenForm(true); };
    const handleEdit = (promo) => { setEditPromo(promo); setOpenForm(true); };
    const handleDeletePrompt = (promo) => {
        setDeletePromo(promo);
        setOpenDeleteDialog(true);
    };

    // Delete confirmation
    const handleDeleteConfirmed = async () => {
        setOpenDeleteDialog(false);
        if (!deletePromo) return;
        setLoading(true);
        try {
            await promosApi.remove(deletePromo.id);
            toast.success("Promo code deleted successfully!");
            fetchPromos();
            setDeletePromo(null);
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to delete promo.");
        } finally {
            setLoading(false);
        }
    };

    // Single status toggle (activate/deactivate one promo)
    const handleStatusToggle = async (promo) => {
        setLoading(true);
        try {
            const newStatus = promo.status === "active" ? "inactive" : "active";
            await promosApi.updateStatus(promo.id, newStatus);
            toast.success(`Promo code "${promo.code}" ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully.`);
            fetchPromos();
        } catch (error) {
            toast.error("Could not update promo status.");
        } finally {
            setLoading(false);
        }
    };

    // Bulk activation
    const handleBulkActivate = async () => {
        if (selectedIds.length === 0) return;
        setLoading(true);
        try {
            await promosApi.bulkUpdateStatus(selectedIds, 'active');
            toast.success("Selected promo codes activated!");
            fetchPromos();
            setSelectedIds([]);
        } catch (error) {
            toast.error("Failed to activate selected promos.");
        } finally {
            setLoading(false);
        }
    };
    // Bulk deactivation
    const handleBulkDeactivate = async () => {
        if (selectedIds.length === 0) return;
        setLoading(true);
        try {
            await promosApi.bulkUpdateStatus(selectedIds, 'inactive');
            toast.success("Selected promo codes deactivated.");
            fetchPromos();
            setSelectedIds([]);
        } catch (error) {
            toast.error("Failed to deactivate selected promos.");
        } finally {
            setLoading(false);
        }
    };

    // Selection helpers
    const toggleSelect = (id) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };
    const toggleSelectAll = () => {
        const currentPageIds = data.map(item => item.id);
        const allSelected = selectedIds.length === currentPageIds.length &&
            currentPageIds.every(id => selectedIds.includes(id));
        if (allSelected) {
            setSelectedIds([]); // deselect all
        } else {
            setSelectedIds(currentPageIds);
        }
    };

    // Define table columns (with handlers)
    const promoColumns = useMemo(() =>
        basePromoColumns({
            onEdit: handleEdit,
            onDelete: handleDeletePrompt,
            onStatusChange: handleStatusToggle,
            selectedIds,
            toggleSelect,
            toggleSelectAll
        }),
        [selectedIds, data]
    );

    // Fetch promos from API
    const fetchPromos = async () => {
        setLoading(true);
        const params = {
            page: pagination.pageIndex + 1,
            per_page: pagination.pageSize,
            sort: sorting[0]
                ? `${sorting[0].id}|${sorting[0].desc ? 'desc' : 'asc'}`
                : '',
            search: search || undefined,
            status: statusFilter === 'all' ? undefined : statusFilter,
        };
        try {
            const res = await promosApi.list(params);
            setData(res.data.data || []);
            setTotal(res.data.meta?.total || 0);
        } catch (e) {
            toast.error("Could not fetch promo codes.");
        } finally {
            setLoading(false);
        }
    };

    // Fetch on initial load and whenever filters change
    useEffect(() => {
        fetchPromos();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search, statusFilter, sorting, pagination.pageIndex, pagination.pageSize]);

    // After form (add/edit) is successfully submitted
    const handleFormSuccess = () => {
        setOpenForm(false);
        fetchPromos();
    };

    return (
        <div>
            <Title
                align="left"
                font="outfit"
                title="Promo Codes"
                subTitle="Manage promotional codes for discounts."
            />
            <div className="flex justify-between items-center mt-4 mb-4">
                <Button onClick={handleAdd} className="cursor-pointer">+ Add Promo Code</Button>
                {selectedIds.length > 0 && (
                    <div className="flex gap-2">
                        <Button onClick={handleBulkActivate} className="cursor-pointer">Activate Selected</Button>
                        <Button variant="destructive" onClick={handleBulkDeactivate} className="cursor-pointer">
                            Deactivate Selected
                        </Button>
                    </div>
                )}
            </div>
            <ControlsToolbar
                search={search}
                setSearch={setSearch}
                filters={[{
                    key: "status", label: "Status", value: statusFilter, onChange: setStatusFilter,
                    options: [
                        { value: "all", label: "All" },
                        { value: "active", label: "Active" },
                        { value: "inactive", label: "Inactive" },
                    ]
                }]}
            />
            <DataTable
                columns={promoColumns}
                data={data}
                pageCount={Math.ceil(total / pagination.pageSize)}
                state={{ pagination, sorting }}
                onPaginationChange={setPagination}
                onSortingChange={setSorting}
                onPageSizeChange={size =>
                    setPagination(prev => ({ ...prev, pageSize: size, pageIndex: 0 }))
                }
                manualPagination
                loading={loading}
            />
            {/* Add/Edit Form Dialog */}
            <PromoFormDialog
                open={openForm}
                onOpenChange={setOpenForm}
                initialData={editPromo}
                isEdit={!!editPromo}
                loading={loading}
                onSuccess={handleFormSuccess}
                promoId={editPromo?.id}
            />
            {/* Delete Confirmation Dialog */}
            <DeleteDialog
                open={openDeleteDialog}
                onOpenChange={setOpenDeleteDialog}
                onConfirm={handleDeleteConfirmed}
                title="Delete Promo Code"
                description={
                    deletePromo
                        ? `Are you sure you want to delete promo "${deletePromo.code}"? This action cannot be undone.`
                        : ""
                }
            />
        </div>
    );
};

export default ListPromos;
