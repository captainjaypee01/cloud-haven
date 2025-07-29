// src/pages/admin/users/ListUsers.jsx
import React, { useEffect, useState, useMemo } from 'react';
import Title from '@/components/Title';
import { Button } from '@/components/ui/button';
import ControlsToolbar from '@/components/admin/common/ControlsToolbar';
import DataTable from '@/components/admin/Table/DataTable';
import { userColumns as baseUserColumns } from '@/components/admin/Table/userColumns';
import UserFormDialog from '@/components/admin/forms/UserFormDialog';
import DeleteDialog from '@/components/common/form/DeleteDialog';
import { toast } from 'sonner';
import { useDebounce } from '@/hooks/useDebounce';
import { useUsersApi } from '@/hooks/api/useUsersApi';

const ListUsers = () => {
  const usersApi = useUsersApi();
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);
  const [sorting, setSorting] = useState([]);
  const [statusFilter, setStatusFilter] = useState("active");
  const [roleFilter, setRoleFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [openDialog, setOpenDialog] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [deleteUser, setDeleteUser] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    const params = {
      page: pagination.pageIndex + 1,
      per_page: pagination.pageSize,
      sort: sorting[0] 
        ? `${sorting[0].id}|${sorting[0].desc ? 'desc' : 'asc'}`
        : 'created_at|desc',
      search: debouncedSearch,
      status: statusFilter === 'all' ? 'all' : statusFilter,  // 'active', 'archived', or 'all'
      role: roleFilter === 'all' ? undefined : roleFilter     // only filter role if not "all"
    };
    try {
      const res = await usersApi.list(params);
      setData(res.data.data || []);
      setTotal(res.data.meta?.total || 0);
    } catch (e) {
      toast.error("Could not fetch users.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch users whenever filters, sorting, or pagination change
  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, sorting, statusFilter, roleFilter, pagination]);

  // Handlers for dialog open/close
  const handleAdd = () => { setEditUser(null); setOpenDialog(true); };
  const handleEdit = (user) => { setEditUser(user); setOpenDialog(true); };
  const handleDeletePrompt = (user) => {
    setDeleteUser(user);
    setDeleteDialogOpen(true);
  };
  const handleDeleteConfirmed = async () => {
    setDeleteDialogOpen(false);
    if (!deleteUser) return;
    setLoading(true);
    try {
      await usersApi.remove(deleteUser.id);
      toast.success("User archived successfully!");
      // refetch the list to see updated data
      fetchUsers();
      setDeleteUser(null);
    } catch (error) {
      toast.error("Failed to delete the user. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Define columns including action buttons
  const userColumns = useMemo(() => [
    ...baseUserColumns,
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={() => handleEdit(row.original)}>
            Edit
          </Button>
          <Button size="sm" variant="destructive" onClick={() => handleDeletePrompt(row.original)}>
            Delete
          </Button>
        </div>
      ),
      enableSorting: false,
    }
  ], [baseUserColumns]);

  return (
    <div>
      <Title 
        align="left"
        font="outfit"
        title="Users"
        subTitle="View, create, or manage user accounts."
      />
      <div className="flex justify-between items-center mt-4 mb-4">
        <Button onClick={handleAdd}>+ Add User</Button>
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
              { value: "archived", label: "Archived" },
            ]
          },
          {
            key: "role", label: "Role", value: roleFilter, onChange: setRoleFilter,
            options: [
              { value: "all", label: "All Roles" },
              { value: "user", label: "User" },
              { value: "staff", label: "Staff" },
              { value: "admin", label: "Admin" },
              { value: "superadmin", label: "Superadmin" },
              // Optionally:
              // { value: "superadmin", label: "Superadmin" }
            ]
          }
        ]}
      />
      <DataTable
        columns={userColumns}
        data={data}
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
      <UserFormDialog
        open={openDialog}
        onOpenChange={(open) => { setOpenDialog(open); if (!open) setEditUser(null); }}
        initialData={editUser}
        isEdit={!!editUser}
        onSuccess={() => {
          setOpenDialog(false);
          fetchUsers();
        }}
        loading={loading}
        userId={editUser?.id}
      />
      <DeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete User"
        description={
          deleteUser 
            ? `Are you sure you want to archive "${deleteUser.first_name} ${deleteUser.last_name}"? 
                This will revoke their access.`
            : "Are you sure you want to delete this user?"
        }
        onConfirm={handleDeleteConfirmed}
      />
    </div>
  );
};

export default ListUsers;
