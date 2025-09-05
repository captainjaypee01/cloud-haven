// src/pages/admin/meal-programs/index.jsx
import React, { useEffect, useState, useMemo } from 'react';
import Title from '@/components/Title';
import { Button } from '@/components/ui/button';
import ControlsToolbar from '@/components/admin/common/ControlsToolbar';
import DataTable from '@/components/admin/Table/DataTable';
import { mealProgramColumns } from '@/components/admin/Table/mealProgramColumns';
import DeleteDialog from '@/components/common/form/DeleteDialog';
import { toast } from 'sonner';
import { useDebounce } from '@/hooks/useDebounce';
import { useMealProgramsApi } from '@/hooks/api/useMealProgramsApi';
import { useAppContext } from '@/context/AppContext';

export default function MealProgramList() {
  const { navigate } = useAppContext();
  const mealProgramsApi = useMealProgramsApi();

  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);
  const [sorting, setSorting] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [deleteProgram, setDeleteProgram] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const fetchPrograms = async () => {
    setLoading(true);
    const params = {
      page: pagination.pageIndex + 1,
      per_page: pagination.pageSize,
      sort: sorting[0] 
        ? `${sorting[0].id}|${sorting[0].desc ? 'desc' : 'asc'}`
        : 'created_at|desc',
      search: debouncedSearch,
      status: statusFilter === 'all' ? undefined : statusFilter,
    };
    try {
      const res = await mealProgramsApi.list(params);
      setData(res.data.data || []);
      setTotal(res.data.meta?.total || 0);
    } catch (e) {
      console.error('Error fetching meal programs:', e);
      toast.error("Could not fetch meal programs.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch on initial load and whenever filters change
  useEffect(() => {
    fetchPrograms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, sorting, statusFilter, pagination]);

  // Handlers for opening dialogs
  const handleAdd = () => navigate("/admin/meal-programs/new");
  const handleEdit = (program) => navigate(`/admin/meal-programs/${program.id}/edit`);
  const handleView = (program) => navigate(`/admin/meal-programs/${program.id}`);
  const handlePreview = (program) => navigate(`/admin/meal-programs/${program.id}/preview`);
  const handleDeletePrompt = (program) => {
    setDeleteProgram(program);
    setDeleteDialogOpen(true);
  };

  // Delete confirmation
  const handleDeleteConfirmed = async () => {
    setDeleteDialogOpen(false);
    if (!deleteProgram) return;
    setLoading(true);
    try {
      await mealProgramsApi.remove(deleteProgram.id);
      toast.success("Meal program deleted successfully!");
      fetchPrograms();
      setDeleteProgram(null);
    } catch (error) {
      toast.error("Failed to delete meal program.");
    } finally {
      setLoading(false);
    }
  };

  // Define columns including action buttons
  const columns = useMemo(() => 
    mealProgramColumns({ onEdit: handleEdit, onDelete: handleDeletePrompt, onView: handleView, onPreview: handlePreview }),
    []
  );

  return (
    <div>
      <Title
        align="left"
        title="Meal Programs"
        subTitle="Manage meal programs and pricing"
      />
      
      <div className="flex justify-between items-center mt-4 mb-4">
        <Button onClick={handleAdd} className="cursor-pointer">+ Add Meal Program</Button>
      </div>
      <ControlsToolbar
        search={search}
        setSearch={setSearch}
        filters={[
          { 
            key: "status", label: "Status", value: statusFilter, onChange: setStatusFilter,
            options: [
              { value: "all", label: "All" },
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
            ]
          }
        ]}
      />

      <DataTable
        data={data}
        columns={columns}
        pageCount={Math.ceil(total / pagination.pageSize)}
        state={{ pagination, sorting }}
        onPaginationChange={setPagination}
        onSortingChange={setSorting}
        onPageSizeChange={(size) => 
          setPagination(prev => ({ ...prev, pageSize: size, pageIndex: 0 }))
        }
        manualPagination
        loading={loading}
      />

      <DeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirmed}
        title="Delete Meal Program"
        description={`Are you sure you want to delete "${deleteProgram?.name}"? This action cannot be undone.`}
      />
    </div>
  );
}