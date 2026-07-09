// pages/admin/ListRoom.jsx
import React, { useEffect, useState, useMemo } from 'react';
import Title from '../../../components/Title';
import { Button } from '@/components/ui/button';
import ControlsToolbar from '@/components/admin/common/ControlsToolbar';
import { useApi } from '@/hooks/useApi';
import { API_PREFIX } from '@/constants/api';
import DataTable from '@/components/admin/Table/DataTable';
import { roomColumns as baseRoomColumns } from '@/components/admin/Table/roomColumns';
import RoomFormDialog from '@/components/admin/forms/RoomFormDialog';
import DeleteDialog from '@/components/common/form/DeleteDialog';
import { toast } from "sonner";
import { useDebounce } from '@/hooks/useDebounce';
import { useNavigate } from 'react-router-dom';
import { CalendarDays } from 'lucide-react';

const ListRoom = () => {
  const navigate = useNavigate()
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400); // 400ms debounce
  const [sorting, setSorting] = useState([]);
  const [status, setStatus] = useState("all");
  const [roomType, setRoomType] = useState("all");
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [openDialog, setOpenDialog] = useState(false);
  const [editRoom, setEditRoom] = useState(null);
  const [deleteRoom, setDeleteRoom] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const api = useApi();

  // Dialog handlers
  const handleAdd = () => { setEditRoom(null); setOpenDialog(true); };
  const handleEdit = (room) => { setEditRoom(room); setOpenDialog(true); };
  const handleDeletePrompt = (room) => {
    setDeleteRoom(room);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirmed = async () => {
    setDeleteDialogOpen(false);
    if (!deleteRoom) return;
    setLoading(true);

    try {
      await api.delete(`${API_PREFIX}/admin/rooms/${deleteRoom.id}`, {
        requiresAuth: true,
      });
      toast.success("Room archived successfully!");
      fetchRooms({ search, status, room_type: roomType });
      setDeleteRoom(null);
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    }
    finally {
      setLoading(false);
    }
  };

  // Actions column
  const roomColumns = useMemo(() => [
    ...baseRoomColumns.filter(col => col.id !== "actions"),
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="cursor-pointer"
            onClick={() => navigate(`/admin/room-units/${row.original.id}`)}
          >
            Units
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="cursor-pointer"
            onClick={() => navigate(`/admin/rooms/${row.original.id}/pricing`)}
          >
            Pricing
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className="cursor-pointer"
            onClick={() => handleEdit(row.original)}
          >Edit</Button>
          <Button
            size="sm"
            variant="destructive"
            className="cursor-pointer"
            onClick={() => handleDeletePrompt(row.original)}
          >Delete</Button>
        </div>
      ),
      enableSorting: false,
    }
  ], [baseRoomColumns, data]);

  // Fetch rooms from API
  const fetchRooms = async (params = {}) => {
    setLoading(true);
    const merged = {
      ...params,
      page: pagination.pageIndex + 1,
      per_page: pagination.pageSize,
      sort: sorting[0]
        ? `${sorting[0].id}|${sorting[0].desc ? 'desc' : 'asc'}`
        : 'name|asc'
    };
    const roomListRes = await api.get(`${API_PREFIX}/admin/rooms`, {
      headers: { "Content-Type": "application/json" },
      params: merged,
      requiresAuth: true,
    });
    setData(roomListRes?.data?.data || []);
    setTotal(roomListRes?.data?.meta?.total || 0);
    setLoading(false);
  };

  useEffect(() => {
    fetchRooms({ search: debouncedSearch, status, room_type: roomType });
    // eslint-disable-next-line
  }, [debouncedSearch, sorting, status, roomType, pagination]);

  return (
    <div>
      <Title
        align='left'
        font='outfit'
        title='Room Listings'
        subTitle='View, edit, or manage all listed rooms.'
      />
      <div className="flex justify-between items-center mb-4 mt-4">
        <div className="flex gap-2">
          <Button onClick={handleAdd} className="cursor-pointer">+ Add Room</Button>
          <Button 
            onClick={() => navigate('/admin/room-units/blocked-dates')} 
            variant="outline" 
            className="cursor-pointer"
          >
            <CalendarDays className="w-4 h-4 mr-2" />
            Blocked Dates
          </Button>
        </div>
      </div>
      <ControlsToolbar
        search={search}
        setSearch={setSearch}
        filters={[
          {
            key: "status", label: "Status", value: status, onChange: setStatus,
            options: [
              { value: "all", label: "All" },
              { value: "available", label: "Available" },
              { value: "unavailable", label: "Unavailable" },
              { value: "archived", label: "Archived" },
            ]
          },
          {
            key: "room_type", label: "Room Type", value: roomType, onChange: setRoomType,
            options: [
              { value: "all", label: "All Types" },
              { value: "overnight", label: "Overnight Stay" },
              { value: "day_tour", label: "Day Tour" },
            ]
          }
        ]}
      />
      <RoomFormDialog
        open={openDialog}
        onOpenChange={setOpenDialog}
        initialData={editRoom}
        loading={loading}
        isEdit={!!editRoom}
        onSuccess={() => {
          setOpenDialog(false);
          fetchRooms({ search, status, room_type: roomType });
        }}
        roomId={editRoom?.id}
      />
      <DataTable
        columns={roomColumns}
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
      <DeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirmed}
        title="Delete Room"
        description={`Are you sure you want to delete "${deleteRoom?.name}"? This action cannot be undone.`}
      />
    </div>
  );
};

export default ListRoom;
