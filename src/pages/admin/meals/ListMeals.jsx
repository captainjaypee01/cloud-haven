// src/pages/admin/meals/ListMeals.jsx
import React, { useEffect, useState, useMemo } from 'react';
import Title from '@/components/Title';
import { Button } from '@/components/ui/button';
import ControlsToolbar from '@/components/admin/common/ControlsToolbar';
import DataTable from '@/components/admin/Table/DataTable';
import { mealPriceColumns as baseMealPriceColumns } from '@/components/admin/Table/mealPriceColumns';
import MealPriceFormDialog from '@/components/admin/forms/MealPriceFormDialog';
import DeleteDialog from '@/components/common/form/DeleteDialog';
import { toast } from 'sonner';
import { useMealsApi } from '@/hooks/api/useMealsApi';

const ListMeals = () => {
    const mealsApi = useMealsApi();

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
    const [editMealPrice, setEditMealPrice] = useState(null);
    const [deleteMealPrice, setDeleteMealPrice] = useState(null);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

    // Handlers for opening dialogs
    const handleAdd = () => { setEditMealPrice(null); setOpenForm(true); };
    const handleEdit = (mealPrice) => { setEditMealPrice(mealPrice); setOpenForm(true); };
    const handleDeletePrompt = (mealPrice) => {
        setDeleteMealPrice(mealPrice);
        setOpenDeleteDialog(true);
    };

    // Delete confirmation
    const handleDeleteConfirmed = async () => {
        setOpenDeleteDialog(false);
        if (!deleteMealPrice) return;
        setLoading(true);
        try {
            await mealsApi.remove(deleteMealPrice.id);
            toast.success("Meal Price deleted successfully!");
            fetchMealPrices();
            setDeleteMealPrice(null);
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to delete meal price.");
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
    const mealPriceColumns = useMemo(() =>
        baseMealPriceColumns({
            onEdit: handleEdit,
            onDelete: handleDeletePrompt,
            selectedIds,
            toggleSelect,
            toggleSelectAll
        }),
        [selectedIds, data]
    );

    // Fetch meal prices from API
    const fetchMealPrices = async () => {
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
            const res = await mealsApi.list(params);
            console.log(res)
            setData(res.data.data || []);
            setTotal(res.data.meta?.total || 0);
        } catch (e) {
            toast.error("Could not fetch meal prices.");
        } finally {
            setLoading(false);
        }
    };

    // Fetch on initial load and whenever filters change
    useEffect(() => {
        fetchMealPrices();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search, statusFilter, sorting, pagination.pageIndex, pagination.pageSize]);

    // After form (add/edit) is successfully submitted
    const handleFormSuccess = () => {
        setOpenForm(false);
        fetchMealPrices();
    };

    return (
        <div>
            <Title
                align="left"
                font="outfit"
                title="Meal Prices"
                subTitle="Manage meal prices."
            />
            <div className="flex justify-between items-center mt-4 mb-4">
                <Button onClick={handleAdd} className="cursor-pointer">+ Add Meal Price</Button>
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
                columns={mealPriceColumns}
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
            <MealPriceFormDialog
                open={openForm}
                onOpenChange={setOpenForm}
                initialData={editMealPrice}
                isEdit={!!editMealPrice}
                loading={loading}
                onSuccess={handleFormSuccess}
                mealPriceId={editMealPrice?.id}
            />
            {/* Delete Confirmation Dialog */}
            <DeleteDialog
                open={openDeleteDialog}
                onOpenChange={setOpenDeleteDialog}
                onConfirm={handleDeleteConfirmed}
                title="Delete Meal Price"
                description={
                    deleteMealPrice
                        ? `Are you sure you want to delete meal price "${deleteMealPrice.category}"? This action cannot be undone.`
                        : ""
                }
            />
        </div>
    );
};

export default ListMeals;
