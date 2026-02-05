// pages/admin/payments/ListPayment.jsx
import React, { useEffect, useState, useMemo } from 'react';
import Title from '../../../components/Title';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ControlsToolbar from '@/components/admin/common/ControlsToolbar';
import { useApi } from '@/hooks/useApi';
import { API_PREFIX } from '@/constants/api';
import DataTable from '@/components/admin/Table/DataTable';
import { StatusBadge } from '@/components/admin/common/StatusBadge';
import { formatCurrency, formatDateTime } from '@/lib/format';
import { useNavigate } from 'react-router-dom';
import { useDebounce } from '@/hooks/useDebounce';
import { Badge } from '@/components/ui/badge';
import { getPaymentProviderLabel } from '@/utils/paymentUtils';
import { Check, XCircle, RotateCcw, Eye } from 'lucide-react';
import ProofImageDialog from '@/components/admin/booking/ProofImageDialog';
import AddPaymentDialog from '@/components/admin/booking/AddPaymentDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from '@/components/ui/dialog';

const ListPayment = () => {
    const [data, setData] = useState([]);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState("");
    const debouncedSearch = useDebounce(search, 400);
    const [sorting, setSorting] = useState([]);
    const [status, setStatus] = useState("all");
    const [proofStatus, setProofStatus] = useState("all");
    const [dateFilter, setDateFilter] = useState("");
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

    // Dialog states
    const [showProofDialog, setShowProofDialog] = useState(false);
    const [selectedPaymentProof, setSelectedPaymentProof] = useState(null);
    const [showEditPayment, setShowEditPayment] = useState(false);
    const [editPayment, setEditPayment] = useState(null);
    const [resetProofDialog, setResetProofDialog] = useState(false);
    const [statusProofDialog, setStatusProofDialog] = useState(false);
    const [remarksDialog, setRemarksDialog] = useState(false);
    const [selectedProofPayment, setSelectedProofPayment] = useState(null);
    const [proofAction, setProofAction] = useState(null); // 'accepted' or 'rejected'

    const api = useApi();
    const navigate = useNavigate();

    const resetForm = useForm({
        defaultValues: { reason: '' }
    });

    const statusForm = useForm({
        defaultValues: { reason: '' },
        resolver: (values) => {
            const errors = {};
            if (proofAction === 'rejected' && (!values.reason || values.reason.trim() === '')) {
                errors.reason = { type: 'required', message: 'Rejection reason is required' };
            }
            return { values, errors };
        }
    });

    const getProofStatusBadge = (proofStatus, uploadCount = 0) => {
        if (!proofStatus || proofStatus === 'none') {
            return <span className="text-xs text-gray-500">{uploadCount}/3</span>;
        }

        switch (proofStatus) {
            case 'pending':
                return <Badge variant="warning" className="text-xs">Under Review ({uploadCount}/3)</Badge>;
            case 'accepted':
                return <Badge variant="success" className="text-xs">Accepted ({uploadCount}/3)</Badge>;
            case 'rejected':
                return <Badge variant="destructive" className="text-xs">Rejected ({uploadCount}/3)</Badge>;
            default:
                return <span className="text-xs text-gray-500">{uploadCount}/3</span>;
        }
    };

    const handleViewProof = (payment) => {
        setSelectedPaymentProof(payment);
        setShowProofDialog(true);
    };

    const handleEditPayment = (payment) => {
        setEditPayment(payment);
        setShowEditPayment(true);
    };

    const handleResetProofUploads = (payment) => {
        setSelectedProofPayment(payment);
        resetForm.reset({ reason: '' });
        setResetProofDialog(true);
    };

    const handleProofStatusAction = (payment, action) => {
        setSelectedProofPayment(payment);
        setProofAction(action);
        statusForm.reset({ reason: '' });
        setStatusProofDialog(true);
    };

    const handleRemarksAction = (payment) => {
        setEditPayment(payment);
        setRemarksDialog(true);
    };

    const confirmResetProofUploads = async (data) => {
        if (!selectedProofPayment) return;

        try {
            await api.patch(
                `${API_PREFIX}/admin/payments/${selectedProofPayment.id}/proof-upload/reset`,
                { reason: data.reason },
                { requiresAuth: true }
            );
            toast.success('Proof uploads reset successfully');
            setResetProofDialog(false);
            setSelectedProofPayment(null);
            fetchPayments();
        } catch (error) {
            toast.error('Failed to reset proof uploads');
        }
    };

    const confirmProofStatusUpdate = async (data) => {
        if (!selectedProofPayment || !proofAction) return;

        // Additional validation for rejection reason
        if (proofAction === 'rejected' && (!data.reason || data.reason.trim() === '')) {
            toast.error('Rejection reason is required');
            return;
        }

        try {
            await api.patch(
                `${API_PREFIX}/admin/payments/${selectedProofPayment.id}/proof-status`,
                {
                    status: proofAction,
                    reason: proofAction === 'rejected' ? data.reason : undefined
                },
                { requiresAuth: true }
            );
            toast.success(`Proof ${proofAction} successfully`);
            setStatusProofDialog(false);
            setSelectedProofPayment(null);
            setProofAction(null);
            fetchPayments();
        } catch (error) {
            toast.error(`Failed to ${proofAction} proof`);
        }
    };

    // Columns for the payments table
    const paymentColumns = useMemo(() => [
        {
            id: "reference_number",
            header: "Reference #",
            accessorKey: "booking.reference_number",
            cell: ({ row }) => {
                const booking = row.original.booking;
                const referenceNumber = booking?.reference_number || '-';

                if (booking?.id) {
                    return (
                        <Button
                            variant="link"
                            size="sm"
                            onClick={() => navigate(`/admin/bookings/${booking.id}`)}
                            className="text-blue-700 p-0 h-auto cursor-pointer font-medium"
                        >
                            {referenceNumber}
                        </Button>
                    );
                }

                return (
                    <span className="text-gray-500 font-medium">
                        {referenceNumber}
                    </span>
                );
            },
        },
        {
            id: "created_at",
            header: "Date",
            accessorKey: "created_at",
            cell: ({ row }) => formatDateTime(row.original.created_at),
        },
        {
            id: "provider",
            header: "Provider",
            accessorKey: "provider",
            cell: ({ row }) => getPaymentProviderLabel(row.original.provider) || '-',
        },
        {
            id: "amount",
            header: "Amount",
            accessorKey: "amount",
            cell: ({ row }) => formatCurrency(row.original.amount),
        },
        {
            id: "status",
            header: "Status",
            accessorKey: "status",
            cell: ({ row }) => <StatusBadge status={row.original.status} />,
        },
        {
            id: "transaction_id",
            header: "Transaction ID",
            accessorKey: "transaction_id",
            cell: ({ row }) => (
                <span className="font-mono text-xs">
                    {row.original.transaction_id || '-'}
                </span>
            ),
        },
        {
            id: "remarks",
            header: "Remarks",
            accessorKey: "remarks",
            cell: ({ row }) => (
                <Button
                    variant="link"
                    size="sm"
                    onClick={() => handleRemarksAction(row.original)}
                    className="text-cyan-700 p-0 h-auto cursor-pointer"
                >Remarks
                </Button>
            ),
        },
        {
            id: "error",
            header: "Error",
            accessorKey: "error_code",
            cell: ({ row }) => {
                const errorCode = row.original.error_code;
                const errorMessage = row.original.error_message;

                if (!errorCode && !errorMessage) return '-';

                return (
                    <div className="text-xs">
                        {errorCode && (
                            <div className="font-mono text-red-600">{errorCode}</div>
                        )}
                        {errorMessage && (
                            <div className="text-red-600 text-wrap max-w-48" title={errorMessage}>
                                {errorMessage.length > 50 ?
                                    `${errorMessage.substring(0, 50)}...` :
                                    errorMessage
                                }
                            </div>
                        )}
                    </div>
                );
            },
        },
        {
            id: "proof_status",
            header: "Proof Status",
            accessorKey: "proof_status",
            cell: ({ row }) => (
                <div className="space-y-1">
                    {getProofStatusBadge(row.original.proof_status, row.original.proof_upload_count)}
                    {row.original.proof_rejected_reason && (
                        <div className="text-xs text-red-600" title={row.original.proof_rejected_reason}>
                            Reason: {row.original.proof_rejected_reason.length > 30 ?
                                `${row.original.proof_rejected_reason.substring(0, 30)}...` :
                                row.original.proof_rejected_reason
                            }
                        </div>
                    )}
                </div>
            ),
        },
        {
            id: "proof_file",
            header: "Proof File",
            accessorKey: "proof_image_url",
            cell: ({ row }) => (
                row.original.proof_last_file_path || row.original.proof_image_url ? (
                    <Button
                        variant="link"
                        size="sm"
                        onClick={() => handleViewProof(row.original)}
                        className="text-cyan-700 p-0 h-auto cursor-pointer"
                    >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                    </Button>
                ) : (
                    '-'
                )
            ),
        },
        {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => (
                <div className="flex flex-col gap-1">
                    <div className="flex gap-1">
                        <Button
                            size="sm"
                            variant="secondary"
                            className="cursor-pointer text-xs"
                            onClick={() => handleEditPayment(row.original)}
                        >
                            Edit
                        </Button>
                        {row.original.booking?.id && (
                            <Button
                                size="sm"
                                variant="outline"
                                className="cursor-pointer text-xs"
                                onClick={() => navigate(`/admin/bookings/${row.original.booking.id}`)}
                            >
                                View Booking
                            </Button>
                        )}
                    </div>

                    <div className="flex gap-1">
                        <Button
                            size="sm"
                            variant="outline"
                            className="cursor-pointer text-xs"
                            onClick={() => handleResetProofUploads(row.original)}
                            title="Reset proof uploads"
                        >
                            <RotateCcw className="h-3 w-3 mr-1" />
                            Reset
                        </Button>

                        {row.original.proof_status === 'pending' && (
                            <>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="cursor-pointer text-xs text-green-600 hover:text-green-700"
                                    onClick={() => handleProofStatusAction(row.original, 'accepted')}
                                    title="Accept proof"
                                >
                                    <Check className="h-3 w-3" />
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="cursor-pointer text-xs text-red-600 hover:text-red-700"
                                    onClick={() => handleProofStatusAction(row.original, 'rejected')}
                                    title="Reject proof"
                                >
                                    <XCircle className="h-3 w-3" />
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            ),
            enableSorting: false,
        }
    ], [navigate]);

    // Fetch payments from API
    const fetchPayments = async (params = {}) => {
        setLoading(true);

        // Validate date range
        let validFromDate = fromDate;
        let validToDate = toDate;

        if (fromDate && toDate && fromDate > toDate) {
            // If from_date is after to_date, swap them
            validFromDate = toDate;
            validToDate = fromDate;
        }

        const merged = {
            ...params,
            page: pagination.pageIndex + 1,
            per_page: pagination.pageSize,
            sort: sorting[0]
                ? `${sorting[0].id}|${sorting[0].desc ? 'desc' : 'asc'}`
                : 'created_at|desc',
            status: status === 'all' ? undefined : status,
            proof_status: proofStatus === 'all' ? undefined : proofStatus,
            date: dateFilter || undefined,
            from_date: validFromDate || undefined,
            to_date: validToDate || undefined,
        };
        try {
            const res = await api.get(`${API_PREFIX}/admin/payments`, {
                headers: { "Content-Type": "application/json" },
                params: merged,
                requiresAuth: true,
            });
            setData(res?.data?.data || []);
            setTotal(res?.data?.meta?.total || 0);
        } catch (error) {
            toast.error('Failed to fetch payments');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPayments({
            search: debouncedSearch,
            status,
            proof_status: proofStatus,
            date: dateFilter,
            from_date: fromDate,
            to_date: toDate
        });
        // eslint-disable-next-line
    }, [debouncedSearch, sorting, status, proofStatus, dateFilter, fromDate, toDate, pagination]);

    return (
        <div>
            <Title
                align='left'
                font='outfit'
                title='Payment Listings'
                subTitle='Monitor and manage all payment transactions.'
            />
            <p className='text-gray-500 mt-8'>All Payments</p>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Payments</h2>
            </div>
            <ControlsToolbar
                search={search}
                setSearch={setSearch}
                searchLabel="Search by Reference Number"
                filters={[
                    {
                        key: "status",
                        label: "Filter by Payment Status",
                        value: status,
                        onChange: setStatus,
                        options: [
                            { value: "all", label: "All Payment Statuses" },
                            { value: "pending", label: "Pending Payments" },
                            { value: "paid", label: "Paid Payments" },
                            { value: "failed", label: "Failed Payments" },
                            { value: "cancelled", label: "Cancelled Payments" },
                        ]
                    },
                    {
                        key: "proof_status",
                        label: "Filter by Proof Status",
                        value: proofStatus,
                        onChange: setProofStatus,
                        options: [
                            { value: "all", label: "All Proof Statuses" },
                            { value: "none", label: "No Proof Uploaded" },
                            { value: "pending", label: "Proof Under Review" },
                            { value: "accepted", label: "Proof Accepted" },
                            { value: "rejected", label: "Proof Rejected" },
                        ]
                    }
                ]}
            />
            <div className="mb-4 space-y-4">
                <div className="flex gap-4 items-end">
                    <div className="flex flex-col">
                        <label className="text-sm font-medium mb-1">Filter by Date Range (From - To)</label>
                        <div className="flex gap-2 items-center">
                            <Input
                                type="date"
                                value={fromDate}
                                onChange={(e) => setFromDate(e.target.value)}
                                className="w-40"
                                placeholder="From date"
                            />
                            <span className="text-gray-500">to</span>
                            <Input
                                type="date"
                                value={toDate}
                                onChange={(e) => setToDate(e.target.value)}
                                className="w-40"
                                placeholder="To date"
                            />
                        </div>
                        {fromDate && toDate && fromDate > toDate && (
                            <p className="text-xs text-amber-600 mt-1">
                                ⚠️ Date range will be automatically corrected (from {toDate} to {fromDate})
                            </p>
                        )}
                    </div>
                    {(fromDate || toDate) && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                setFromDate("");
                                setToDate("");
                            }}
                        >
                            Clear Date Range
                        </Button>
                    )}
                </div>

                <div className="flex gap-4 items-end">
                    <div className="flex flex-col">
                        <label className="text-sm font-medium mb-1">Or Filter by Specific Date</label>
                        <Input
                            type="date"
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                            className="w-48"
                            placeholder="Select specific date"
                        />
                    </div>
                    {dateFilter && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDateFilter("")}
                        >
                            Clear Specific Date
                        </Button>
                    )}
                </div>
            </div>
            <DataTable
                columns={paymentColumns}
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

            {/* Proof Image Dialog */}
            <ProofImageDialog
                open={showProofDialog}
                onOpenChange={setShowProofDialog}
                imageUrl={selectedPaymentProof?.proof_image_url || selectedPaymentProof?.proof_last_file_path}
                paymentInfo={selectedPaymentProof}
            />

            {/* Edit Payment Dialog */}
            <AddPaymentDialog
                open={showEditPayment}
                onOpenChange={setShowEditPayment}
                bookingReferenceNumber={editPayment?.booking?.reference_number}
                onSuccess={() => {
                    setEditPayment(null);
                    fetchPayments();
                }}
                payment={editPayment}
                isEdit={!!editPayment}
            />

            {/* Reset Proof Uploads Dialog */}
            <AlertDialog open={resetProofDialog} onOpenChange={setResetProofDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Reset Proof Uploads</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will reset the proof upload count to 0/3 for this payment, allowing the guest to upload new proof files.
                            If there's a pending proof, it will be marked as rejected.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <Form {...resetForm}>
                        <form onSubmit={resetForm.handleSubmit(confirmResetProofUploads)}>
                            <FormField
                                control={resetForm.control}
                                name="reason"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Reason (Optional)</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Enter reason for resetting proof uploads..."
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <AlertDialogFooter className="mt-4">
                                <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
                                <AlertDialogAction type="submit" className="cursor-pointer">
                                    Reset Upload Count
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </form>
                    </Form>
                </AlertDialogContent>
            </AlertDialog>

            {/* Proof Status Update Dialog */}
            <AlertDialog open={statusProofDialog} onOpenChange={setStatusProofDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {proofAction === 'accepted' ? 'Accept' : 'Reject'} Proof of Payment
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {proofAction === 'accepted'
                                ? 'Mark this proof of payment as accepted and verified.'
                                : 'Reject this proof of payment. Please provide a reason for rejection.'
                            }
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <Form {...statusForm}>
                        <form onSubmit={(e) => e.preventDefault()}>
                            {proofAction === 'rejected' && (
                                <FormField
                                    control={statusForm.control}
                                    name="reason"
                                    rules={{
                                        required: 'Rejection reason is required',
                                        validate: (value) => value.trim() !== '' || 'Rejection reason cannot be empty'
                                    }}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Rejection Reason *</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Enter reason for rejecting this proof..."
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}
                            <AlertDialogFooter className="mt-4">
                                <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                    type="button"
                                    onClick={statusForm.handleSubmit(confirmProofStatusUpdate)}
                                    className={`cursor-pointer ${proofAction === 'rejected' ? 'bg-red-600 hover:bg-red-700' : ''}`}
                                >
                                    {proofAction === 'accepted' ? 'Accept Proof' : 'Reject Proof'}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </form>
                    </Form>
                </AlertDialogContent>
            </AlertDialog>

            <Dialog open={remarksDialog} onOpenChange={() => setRemarksDialog(false)}>
                <DialogContent className="max-h-[90vh] overflow-hidden flex flex-col">
                    <DialogHeader className="flex-shrink-0">
                        <DialogTitle>Remarks</DialogTitle>
                    </DialogHeader>
                    <div className="flex-1 overflow-y-auto px-1">
                        {editPayment?.remarks || '-'}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default ListPayment;
