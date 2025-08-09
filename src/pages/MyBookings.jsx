// src/pages/MyBookings.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from "@clerk/clerk-react";
import { useApi } from '@/hooks/useApi';
import { API_PREFIX } from '@/constants/api';
import { formatCurrency } from "../utils/currency";
import Title from '../components/Title';
import roomImgPlaceholder from '@/assets/roomImg1.png';  // fallback image if needed
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import SeaWaveBg from '../components/common/SeaWaveBg';
import { Users, Heart } from "lucide-react";
import { RoomDetailModal } from "@/components/RoomDetailModal";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { List } from "lucide-react";

const MyBookings = () => {
    const navigate = useNavigate();
    const { user } = useUser();
    const api = useApi();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("all");
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedRoomId, setSelectedRoomId] = useState(null);

    useEffect(() => {
        if (!user) return;  // if not logged in, skip fetch
        const fetchBookings = async () => {
            setLoading(true);
            try {
                // Fetch bookings for current user (assuming API returns user's bookings)
                const res = await api.get(`${API_PREFIX}/user/bookings/user`, { requiresAuth: true });
                const data = res.data?.data || res.data?.bookings || res.data;
                setBookings(data || []);
            } catch (error) {
                console.error("Failed to fetch bookings:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchBookings();
    }, [user]);

    const toDate = (value) => {
        if (!value) return null;
        try {
            return new Date(value);
        } catch {
            return null;
        }
    };

    const formatDate = (value) => {
        const d = toDate(value);
        if (!d) return "—";
        return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    };

    const getRoomImage = (room) => {
        const images = room?.images || [];
        const first = images[0];
        const url = first?.secure_image_url || first?.url || (typeof first === 'string' ? first : null);
        return url || roomImgPlaceholder;
    };

    const getRoomId = (room) => room?.slug || room?.id || room?.room_id || room?.name;
    const getRoomsFromBookingRaw = (booking) => (booking?.booking_rooms || []).map((br) => br.room || br).filter(Boolean);
    const getRoomsFromBookingUnique = (booking) => {
        const roomsRaw = getRoomsFromBookingRaw(booking);
        const unique = new Map();
        roomsRaw.forEach((r) => {
            const key = getRoomId(r);
            if (!unique.has(key)) unique.set(key, r);
        });
        return Array.from(unique.values());
    };
    const openRoomModal = (room) => {
        if (!room) return;
        setSelectedRoomId(getRoomId(room));
        setModalOpen(true);
    };

    const statusStr = (b) => (b?.status || "").toLowerCase();
    const isPaid = (b) => statusStr(b) === "paid" || b?.isPaid === true;
    const isUnpaid = (b) => ["pending", "unpaid"].includes(statusStr(b)) || b?.isPaid === false;
    const isPartial = (b) => statusStr(b) === "downpayment";
    const isCompleted = (b) => statusStr(b) === "completed";
    const isCanceled = (b) => ["canceled", "cancelled", "expired"].includes(statusStr(b));

    const isPast = (b) => {
        const out = toDate(b?.check_out_date || b?.checkOutDate);
        if (!out) return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return out < today;
    };

    const isUpcoming = (b) => {
        const inDate = toDate(b?.check_in_date || b?.checkInDate);
        if (!inDate) return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return inDate >= today;
    };

    const counts = useMemo(() => {
        const c = { all: bookings.length, upcoming: 0, past: 0, unpaid: 0, paid: 0 };
        bookings.forEach((b) => {
            if (isUpcoming(b)) c.upcoming += 1;
            if (isPast(b)) c.past += 1;
            if (isUnpaid(b)) c.unpaid += 1;
            if (isPaid(b)) c.paid += 1;
        });
        return c;
    }, [bookings]);

    const filteredBookings = useMemo(() => {
        const list = [...bookings];
        switch (activeTab) {
            case "upcoming":
                return list.filter(isUpcoming).sort((a, b) => new Date(a.check_in_date || a.checkInDate) - new Date(b.check_in_date || b.checkInDate));
            case "past":
                return list.filter(isPast).sort((a, b) => new Date(b.check_out_date || b.checkOutDate) - new Date(a.check_out_date || a.checkOutDate));
            case "unpaid":
                return list.filter(isUnpaid);
            case "paid":
                return list.filter(isPaid);
            default:
                return list;
        }
    }, [bookings, activeTab]);

    const statusBadge = (b) => {
        if (isCanceled(b)) return { label: /expired/i.test(b?.status) ? "Expired" : "Cancelled", variant: "destructive" };
        if (isCompleted(b)) return { label: "Completed", variant: "primary" };
        if (isPaid(b)) return { label: "Paid", variant: "success" };
        if (isPartial(b)) return { label: "Partial", variant: "warning" };
        if (isUnpaid(b)) return { label: "Pending", variant: "secondary" };
        return { label: b?.status || "—", variant: "secondary" };
    };

    const renderSkeleton = () => (
        <div className="space-y-4">
            {[0, 1, 2].map((i) => (
                <Card key={i}>
                    <CardContent className="px-6">
                        <div className="flex gap-4 py-4">
                            <Skeleton className="h-28 w-44 rounded" />
                            <div className="flex-1 space-y-2">
                                <Skeleton className="h-5 w-2/3" />
                                <Skeleton className="h-4 w-1/3" />
                                <Skeleton className="h-4 w-1/2" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );

    const EmptyState = () => (
        <Card className="mt-6">
            <CardHeader>
                <CardTitle>No bookings yet</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">You don’t have any reservations. Start exploring rooms and plan your next stay.</p>
                <div className="mt-4">
                    <Button onClick={() => navigate('/rooms')}>Browse rooms</Button>
                </div>
            </CardContent>
        </Card>
    );

    // If not logged in, prompt login
    if (!user) {
        return (
            <div className="py-32 text-center">
                <h2 className="text-2xl font-semibold mb-4">Please log in to view your bookings.</h2>
            </div>
        );
    }

    return (
        <div className="relative min-h-screen pb-[100px] flex flex-col items-center mt-16 py-16 px-2 bg-gray-50 bg-gradient-to-b from-amber-100 via-sky-50 to-blue-200 overflow-x-hidden">
            <SeaWaveBg />
            <Title
                title='My Bookings'
                subTitle='Easily manage your past, current, and upcoming reservations in one place. Plan your trips seamlessly with just a few clicks.'
                align='left'
            />
            <div className="max-w-6xl mt-6 w-full">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList>
                        <TabsTrigger value="all">All <Badge variant="outline" className="ml-2">{counts.all}</Badge></TabsTrigger>
                        <TabsTrigger value="upcoming">Upcoming <Badge variant="outline" className="ml-2">{counts.upcoming}</Badge></TabsTrigger>
                        <TabsTrigger value="past">Past <Badge variant="outline" className="ml-2">{counts.past}</Badge></TabsTrigger>
                        <TabsTrigger value="unpaid">Unpaid <Badge variant="outline" className="ml-2">{counts.unpaid}</Badge></TabsTrigger>
                        <TabsTrigger value="paid">Paid <Badge variant="outline" className="ml-2">{counts.paid}</Badge></TabsTrigger>
                    </TabsList>

                    <TabsContent value={activeTab} className="mt-4">
                        {loading ? (
                            renderSkeleton()
                        ) : filteredBookings.length === 0 ? (
                            <EmptyState />
                        ) : (
                            <>
                                {/* Desktop table */}
                                <div className="hidden md:block">
                                    <Card>
                                        <CardContent className="pt-6">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Reservation</TableHead>
                                                        <TableHead>Date</TableHead>
                                                        <TableHead>Status</TableHead>
                                                        <TableHead className="text-right">Actions</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {filteredBookings.map((booking) => {
                                                        const roomsInBookingRaw = getRoomsFromBookingRaw(booking);
                                                        const roomsInBookingUnique = getRoomsFromBookingUnique(booking);
                                                        const roomCount = roomsInBookingRaw.length;
                                                        const firstRoom = roomsInBookingRaw[0] || null;
                                                        const roomName = firstRoom?.name || "Room";
                                                        const roomType = firstRoom?.room_type || firstRoom?.type || firstRoom?.roomType;
                                                        const roomDisplayName = roomType ? `${roomName} (${roomType})` : roomName;
                                                        const guestsCount = booking.total_guests ?? (booking.adults + booking.children) ?? booking.guests;
                                                        const imgSrc = getRoomImage(firstRoom);
                                                        const status = statusBadge(booking);
                                                        const ref = booking.reference_number || booking.refNo || booking.id || booking._id;
                                                        return (
                                                            <TableRow key={ref}>
                                                                <TableCell>
                                                                    <div className="flex items-center gap-4">
                                                                        <img src={imgSrc} alt="room" className="h-16 w-24 object-cover rounded" />
                                                                        <div>
                                                                            <div className="font-medium">{roomDisplayName}</div>
                                                                            <div className="text-muted-foreground text-xs flex items-center gap-2 mt-0.5">
                                                                                <span className="inline-flex items-center gap-1"><Users className="w-4 h-4" /><span>Guests: {guestsCount}</span></span>
                                                                                {booking.hotel?.type && (
                                                                                    <span className="inline-flex items-center gap-1"><Heart className="w-4 h-4" /><span>{booking.hotel.type}</span></span>
                                                                                )}
                                                                            </div>
                                                                            <div className="text-xs text-muted-foreground mt-1">Ref: {ref}</div>
                                                                            {roomCount > 1 && (
                                                                                <div className="text-xs text-muted-foreground mt-1">{roomCount} rooms</div>
                                                                            )}
                                                                            <div className="text-sm mt-1">Total: {booking.final_price ? formatCurrency(booking.final_price) : `₱${booking.totalPrice}`}</div>
                                                                        </div>
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell>
                                                                    <div className="text-sm">
                                                                        <div>Check-in: <span className="text-muted-foreground">{formatDate(booking.check_in_date || booking.checkInDate)}</span></div>
                                                                        <div>Check-out: <span className="text-muted-foreground">{formatDate(booking.check_out_date || booking.checkOutDate)}</span></div>
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Badge variant={status.variant}>{status.label}</Badge>
                                                                </TableCell>
                                                                <TableCell className="text-right space-x-2">
                                                                    <Button variant="outline" size="sm" onClick={() => navigate(`/booking/${ref}`)}>View details</Button>
                                                                    {roomCount <= 1 ? (
                                                                        <Button variant="ghost" size="sm" onClick={() => openRoomModal(firstRoom)}>Room details</Button>
                                                                    ) : (
                                                                        <DropdownMenu>
                                                                            <DropdownMenuTrigger asChild>
                                                                                <Button variant="ghost" size="sm" className="cursor-pointer"><List className="w-4 h-4 mr-1" /> Rooms</Button>
                                                                            </DropdownMenuTrigger>
                                                                            <DropdownMenuContent align="end">
                                                                                {roomsInBookingUnique.map((room, idx) => (
                                                                                    <DropdownMenuItem key={getRoomId(room) || idx} onClick={() => openRoomModal(room)}>
                                                                                        View {room?.name || `Room ${idx + 1}`}
                                                                                    </DropdownMenuItem>
                                                                                ))}
                                                                            </DropdownMenuContent>
                                                                        </DropdownMenu>
                                                                    )}
                                                                    {isUnpaid(booking) && !isPast(booking) && (
                                                                        <Button size="sm" onClick={() => navigate(`/booking/${ref}/payment`)}>Pay now</Button>
                                                                    )}
                                                                </TableCell>
                                                            </TableRow>
                                                        );
                                                    })}
                                                </TableBody>
                                            </Table>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Mobile list */}
                                <div className="md:hidden space-y-4">
                                    {filteredBookings.map((booking) => {
                                        const roomsInBookingRaw = getRoomsFromBookingRaw(booking);
                                        const roomsInBookingUnique = getRoomsFromBookingUnique(booking);
                                        const roomCount = roomsInBookingRaw.length;
                                        const firstRoom = roomsInBookingRaw[0] || null;
                                        const roomName = firstRoom?.name || "Room";
                                        const roomType = firstRoom?.room_type || firstRoom?.type || firstRoom?.roomType;
                                        const roomDisplayName = roomType ? `${roomName} (${roomType})` : roomName;
                                        const guestsCount = booking.total_guests ?? (booking.adults + booking.children) ?? booking.guests;
                                        const imgSrc = getRoomImage(firstRoom);
                                        const status = statusBadge(booking);
                                        const ref = booking.reference_number || booking.refNo || booking.id || booking._id;
                                        return (
                                            <Card key={ref}>
                                                <CardContent className="px-6 pt-6">
                                                    <div className="flex gap-4">
                                                        <img src={imgSrc} alt="room" className="h-24 w-32 object-cover rounded" />
                                                        <div className="flex-1">
                                                            <div className="flex items-center justify-between gap-2">
                                                                <div className="font-medium leading-tight">{roomDisplayName}</div>
                                                                <Badge variant={status.variant}>{status.label}</Badge>
                                                            </div>
                                                            <div className="text-muted-foreground text-xs mt-1">Ref: {ref}</div>
                                                            {roomCount > 1 && (
                                                                <div className="text-xs text-muted-foreground mt-1">{roomCount} rooms</div>
                                                            )}
                                                            <div className='flex items-center gap-1 text-sm text-gray-500 mt-1'>
                                                                <Users className="w-4 h-4" />
                                                                <span>Guests: {guestsCount}</span>
                                                            </div>
                                                            {booking.hotel?.type && (
                                                                <div className='flex items-center gap-1 text-xs text-gray-500 mt-1'>
                                                                    <Heart className="w-4 h-4" />
                                                                    <span>{booking.hotel.type}</span>
                                                                </div>
                                                            )}
                                                            <div className='text-sm mt-2'>
                                                                Total: {booking.final_price ? formatCurrency(booking.final_price) : `₱${booking.totalPrice}`}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                                                        <div>
                                                            <div className="text-foreground">Check-in</div>
                                                            <div className="text-muted-foreground">{formatDate(booking.check_in_date || booking.checkInDate)}</div>
                                                        </div>
                                                        <div>
                                                            <div className="text-foreground">Check-out</div>
                                                            <div className="text-muted-foreground">{formatDate(booking.check_out_date || booking.checkOutDate)}</div>
                                                        </div>
                                                    </div>
                                                    <div className="flex justify-end gap-2 mt-4">
                                                        <Button variant="outline" size="sm" onClick={() => navigate(`/booking/${ref}`)}>View details</Button>
                                                        {roomCount <= 1 ? (
                                                            <Button variant="ghost" size="sm" onClick={() => openRoomModal(firstRoom)}>Room details</Button>
                                                        ) : (
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button variant="ghost" size="sm" className="cursor-pointer"><List className="w-4 h-4 mr-1" /> Rooms</Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end">
                                                                    {roomsInBookingUnique.map((room, idx) => (
                                                                        <DropdownMenuItem key={getRoomId(room) || idx} onClick={() => openRoomModal(room)}>
                                                                            View {room?.name || `Room ${idx + 1}`}
                                                                        </DropdownMenuItem>
                                                                    ))}
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        )}
                                                        {isUnpaid(booking) && !isPast(booking) && (
                                                            <Button size="sm" onClick={() => navigate(`/booking/${ref}/payment`)}>Pay now</Button>
                                                        )}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        );
                                    })}
                                </div>
                            </>
                        )}
                    </TabsContent>
                </Tabs>
            </div>
            <RoomDetailModal
                open={modalOpen}
                roomId={selectedRoomId}
                onOpenChange={(open) => {
                    setModalOpen(open);
                    if (!open) setSelectedRoomId(null);
                }}
            />
        </div>
    );
};

export default MyBookings;
