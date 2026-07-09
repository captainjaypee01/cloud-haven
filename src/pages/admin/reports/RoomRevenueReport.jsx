import React, { useState } from 'react';
import Title from '@/components/Title';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useApi } from '@/hooks/useApi';
import { fetchRevenueReport } from '@/services/roomPricing';
import { formatCurrency } from '@/utils/currency';
import { toast } from 'sonner';

const RoomRevenueReport = () => {
    const api = useApi();
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(false);

    const loadReport = async () => {
        if (!from || !to) {
            toast.error('Select from and to dates');
            return;
        }
        setLoading(true);
        try {
            const data = await fetchRevenueReport(api, { from, to });
            setReport(data);
        } catch {
            toast.error('Failed to load report');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <Title align="left" font="outfit" title="Room Revenue Report" subTitle="Booked nightly rates from locked booking snapshots." />
            <div className="flex flex-wrap gap-4 items-end">
                <div>
                    <Label>From</Label>
                    <Input type="date" value={from} onChange={e => setFrom(e.target.value)} />
                </div>
                <div>
                    <Label>To</Label>
                    <Input type="date" value={to} onChange={e => setTo(e.target.value)} />
                </div>
                <Button onClick={loadReport} disabled={loading}>{loading ? 'Loading…' : 'Run report'}</Button>
            </div>
            {report && (
                <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="border rounded-lg p-4">
                            <div className="text-sm text-muted-foreground">Total nights</div>
                            <div className="text-2xl font-semibold">{report.summary.total_nights}</div>
                        </div>
                        <div className="border rounded-lg p-4">
                            <div className="text-sm text-muted-foreground">Total revenue</div>
                            <div className="text-2xl font-semibold">{formatCurrency(report.summary.total_revenue)}</div>
                        </div>
                    </div>
                    <div className="overflow-x-auto border rounded-lg">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-muted/50">
                                    <th className="text-left p-2">Date</th>
                                    <th className="text-left p-2">Room</th>
                                    <th className="text-left p-2">Booking</th>
                                    <th className="text-right p-2">Rate</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(report.rows || []).map((row, i) => (
                                    <tr key={i} className="border-b last:border-0">
                                        <td className="p-2">{row.date}</td>
                                        <td className="p-2">{row.room_name}</td>
                                        <td className="p-2">{row.booking_reference}</td>
                                        <td className="p-2 text-right">{formatCurrency(row.rate)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RoomRevenueReport;
