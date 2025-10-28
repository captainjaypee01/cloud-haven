// src/pages/admin/reviews/ListReviews.jsx
import React, { useEffect, useState, useMemo } from 'react';
import Title from '@/components/Title';
import { Button } from '@/components/ui/button';
import ControlsToolbar from '@/components/admin/common/ControlsToolbar';
import DataTable from '@/components/admin/Table/DataTable';
import { reviewColumns as baseReviewColumns } from '@/components/admin/Table/reviewColumns';
import ReviewFormDialog from '@/components/admin/forms/ReviewFormDialog';
import DeleteDialog from '@/components/common/form/DeleteDialog';
import { toast } from 'sonner';
import { useDebounce } from '@/hooks/useDebounce';
import { useReviewsApi } from '@/hooks/api/useReviewsApi';

const ListReviews = () => {
    const reviewsApi = useReviewsApi();
    const [data, setData] = useState([]);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState("");
    const debouncedSearch = useDebounce(search, 400);
    const [sorting, setSorting] = useState([]);
    const [typeFilter, setTypeFilter] = useState("all");
    const [ratingFilter, setRatingFilter] = useState("all");
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
    const [openDialog, setOpenDialog] = useState(false);
    const [editReview, setEditReview] = useState(null);
    const [deleteReview, setDeleteReview] = useState(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    // Dialog handlers
    const handleAdd = () => { setEditReview(null); setOpenDialog(true); };
    const handleEdit = (review) => { setEditReview(review); setOpenDialog(true); };
    const handleDeletePrompt = (review) => {
        setDeleteReview(review);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirmed = async () => {
        setDeleteDialogOpen(false);
        if (!deleteReview) return;
        setLoading(true);
        try {
            await reviewsApi.remove(deleteReview.id);
            toast.success("Review deleted successfully!");
            fetchReviews();
            setDeleteReview(null);
        } catch (error) {
            toast.error("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // Actions column
    const reviewColumns = useMemo(() => [
        ...baseReviewColumns,
        {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => (
                <div className="flex gap-2">
                    <Button
                        size="sm"
                        variant="secondary"
                        className="cursor-pointer"
                        onClick={() => handleEdit(row.original)}
                    >
                        Edit
                    </Button>
                    <Button
                        size="sm"
                        variant="destructive"
                        className="cursor-pointer"
                        onClick={() => handleDeletePrompt(row.original)}
                    >
                        Delete
                    </Button>
                </div>
            ),
            enableSorting: false,
        }
    ], [baseReviewColumns]);

    // Fetch reviews from API
    const fetchReviews = async () => {
        setLoading(true);
        const params = {
            page: pagination.pageIndex + 1,
            per_page: pagination.pageSize,
            sort: sorting[0]
                ? `${sorting[0].id}|${sorting[0].desc ? 'desc' : 'asc'}`
                : 'created_at|desc',
            search: debouncedSearch,
            type: typeFilter === 'all' ? undefined : typeFilter,
            rating: ratingFilter === 'all' ? undefined : ratingFilter,
        };
        try {
            const res = await reviewsApi.list(params);
            setData(res.data.data || []);
            setTotal(res.data.meta?.total || 0);
        } catch (e) {
            toast.error("Could not fetch reviews.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReviews();
        // eslint-disable-next-line
    }, [debouncedSearch, sorting, typeFilter, ratingFilter, pagination]);

    return (
        <div className="w-full min-w-0">
            <Title
                align='left'
                font='outfit'
                title='Reviews'
                subTitle='View, edit, or manage all customer reviews.'
            />
            <div className="flex justify-between items-center mb-4 mt-4">
                <Button onClick={handleAdd} className="cursor-pointer">+ Add Review</Button>
            </div>
            <ControlsToolbar
                search={search}
                setSearch={setSearch}
                filters={[
                    {
                        key: "type", label: "Type", value: typeFilter, onChange: setTypeFilter,
                        options: [
                            { value: "all", label: "All Types" },
                            { value: "room", label: "Room" },
                            { value: "resort", label: "Resort" },
                        ]
                    },
                    {
                        key: "rating", label: "Rating", value: ratingFilter, onChange: setRatingFilter,
                        options: [
                            { value: "all", label: "All Ratings" },
                            { value: "5", label: "5 Stars" },
                            { value: "4", label: "4 Stars" },
                            { value: "3", label: "3 Stars" },
                            { value: "2", label: "2 Stars" },
                            { value: "1", label: "1 Star" },
                        ]
                    }
                ]}
            />
            <DataTable
                columns={reviewColumns}
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
            <ReviewFormDialog
                open={openDialog}
                onOpenChange={setOpenDialog}
                initialData={editReview}
                loading={loading}
                isEdit={!!editReview}
                onSuccess={() => {
                    setOpenDialog(false);
                    fetchReviews();
                }}
                reviewId={editReview?.id}
            />
            <DeleteDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                onConfirm={handleDeleteConfirmed}
                title="Delete Review"
                description={`Are you sure you want to delete this review? This action cannot be undone.`}
            />
        </div>
    );
};

export default ListReviews;
