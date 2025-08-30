// components/admin/Table/roomUnitColumns.jsx

export const roomUnitColumns = [
  {
    id: "unit_number",
    accessorKey: "unit_number",
    header: "Unit Number",
    enableSorting: true,
  },
  {
    id: "room_name",
    accessorKey: "room.name",
    header: "Room Type",
    enableSorting: true,
    cell: ({ row }) => row.original.room?.name || 'N/A',
  },
  {
    id: "status",
    accessorKey: "status", 
    header: "Status",
    enableSorting: true,
    cell: ({ row }) => {
      const status = row.original.status;
      const statusColors = {
        available: 'bg-green-500',
        occupied: 'bg-blue-500',
        maintenance: 'bg-yellow-500',
        blocked: 'bg-red-500',
      };
      return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white ${statusColors[status] || 'bg-gray-500'}`}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
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
        <span title={notes} className="cursor-help">
          {truncated}
        </span>
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
];
