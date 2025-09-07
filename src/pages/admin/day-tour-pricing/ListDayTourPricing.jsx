// pages/admin/day-tour-pricing/ListDayTourPricing.jsx
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import Title from '../../../components/Title';
import { Button } from '@/components/ui/button';
import ControlsToolbar from '@/components/admin/common/ControlsToolbar';
import { useApi } from '@/hooks/useApi';
import { API_PREFIX } from '@/constants/api';
import DataTable from '@/components/admin/Table/DataTable';
import { dayTourPricingColumns as baseColumns } from '@/components/admin/Table/dayTourPricingColumns';
import DayTourPricingFormDialog from '@/components/admin/forms/DayTourPricingFormDialog';
import DeleteDialog from '@/components/common/form/DeleteDialog';
import { toast } from "sonner";
import { useDebounce } from '@/hooks/useDebounce';

const ListDayTourPricing = () => {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);
  const [sorting, setSorting] = useState([]);
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [openDialog, setOpenDialog] = useState(false);
  const [editPricing, setEditPricing] = useState(null);
  const [deletePricing, setDeletePricing] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const api = useApi();

  // Dialog handlers
  const handleAdd = useCallback(() => { 
    setEditPricing(null); 
    setOpenDialog(true); 
  }, []);
  
  const handleEdit = useCallback((pricing) => { 
    setEditPricing(pricing); 
    setOpenDialog(true); 
  }, []);
  
  const handleDeletePrompt = useCallback((pricing) => {
    setDeletePricing(pricing);
    setDeleteDialogOpen(true);
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: (pagination.pageIndex + 1).toString(),
        per_page: pagination.pageSize.toString(),
      });

      if (debouncedSearch) {
        params.append('search', debouncedSearch);
      }

      if (status !== 'all') {
        params.append('is_active', status === 'active' ? '1' : '0');
      }

      // Add sorting
      if (sorting.length > 0) {
        const sort = sorting[0];
        params.append('sort_by', sort.id);
        params.append('sort_order', sort.desc ? 'desc' : 'asc');
      }

      const response = await api.get(`${API_PREFIX}/admin/day-tour-pricing?${params}`, {
        requiresAuth: true,
      });

      setData(response.data || []);
      setTotal(response.total || 0);
    } catch (error) {
      console.error('Error fetching Day Tour Pricing:', error);
      toast.error('Failed to load Day Tour Pricing');
    } finally {
      setLoading(false);
    }
  }, [api, pagination.pageIndex, pagination.pageSize, debouncedSearch, status, sorting]);

  const handleToggleStatus = useCallback(async (pricing) => {
    setLoading(true);
    try {
      await api.patch(`${API_PREFIX}/admin/day-tour-pricing/${pricing.id}/toggle-status`, {}, {
        requiresAuth: true,
      });
      toast.success(`Pricing ${pricing.is_active ? 'deactivated' : 'activated'} successfully!`);
      fetchData();
    } catch (error) {
      console.error('Error toggling status:', error);
      toast.error('Failed to update pricing status');
    } finally {
      setLoading(false);
    }
  }, [api, fetchData]);

  const handleDeleteConfirmed = useCallback(async () => {
    setDeleteDialogOpen(false);
    if (!deletePricing) return;
    setLoading(true);

    try {
      await api.delete(`${API_PREFIX}/admin/day-tour-pricing/${deletePricing.id}`, {
        requiresAuth: true,
      });
      toast.success("Day Tour Pricing deleted successfully!");
      fetchData();
    } catch (error) {
      console.error('Error deleting pricing:', error);
      toast.error("Failed to delete Day Tour Pricing");
    } finally {
      setLoading(false);
    }
  }, [api, deletePricing, fetchData]);

  const handleSave = useCallback(async (formData) => {
    setLoading(true);
    try {
      if (editPricing) {
        // Update existing pricing
        await api.put(`${API_PREFIX}/admin/day-tour-pricing/${editPricing.id}`, formData, {
          requiresAuth: true,
        });
        toast.success("Day Tour Pricing updated successfully!");
      } else {
        // Create new pricing
        await api.post(`${API_PREFIX}/admin/day-tour-pricing`, formData, {
          requiresAuth: true,
        });
        toast.success("Day Tour Pricing created successfully!");
      }
      fetchData();
    } catch (error) {
      console.error('Error saving pricing:', error);
      toast.error(`Failed to ${editPricing ? 'update' : 'create'} Day Tour Pricing`);
      throw error; // Re-throw to let the form dialog handle it
    } finally {
      setLoading(false);
    }
  }, [api, editPricing, fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Actions column
  const columns = useMemo(() => [
    ...baseColumns.filter(col => col.id !== "actions"),
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleEdit(row.original)}
            className="cursor-pointer"
          >
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleToggleStatus(row.original)}
            className="cursor-pointer"
          >
            {row.original.is_active ? "Deactivate" : "Activate"}
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => handleDeletePrompt(row.original)}
            className="cursor-pointer"
          >
            Delete
          </Button>
        </div>
      ),
      enableSorting: false,
    }
  ], [baseColumns, handleEdit, handleToggleStatus, handleDeletePrompt]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Title>Day Tour Pricing</Title>
        <Button onClick={handleAdd} className="cursor-pointer">
          Add New Pricing
        </Button>
      </div>

      <ControlsToolbar
        search={search}
        onSearchChange={setSearch}
        status={status}
        onStatusChange={setStatus}
        statusOptions={[
          { value: 'all', label: 'All Status' },
          { value: 'active', label: 'Active' },
          { value: 'inactive', label: 'Inactive' },
        ]}
      />

      <DataTable
        columns={columns}
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

      <DayTourPricingFormDialog
        open={openDialog}
        onOpenChange={setOpenDialog}
        onSave={handleSave}
        editingPricing={editPricing}
        loading={loading}
      />

      <DeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirmed}
        title="Delete Day Tour Pricing"
        description={`Are you sure you want to delete "${deletePricing?.name}"? This action cannot be undone.`}
      />
    </div>
  );
};

export default ListDayTourPricing;
