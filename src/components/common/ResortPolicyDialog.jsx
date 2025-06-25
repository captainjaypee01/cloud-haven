
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import {
    Tabs,
    TabsList,
    TabsTrigger,
    TabsContent,
} from "@/components/ui/tabs";
import { useState } from "react";

const ResortPolicyDialog = () => {
    const [policyOpen, setPolicyOpen] = useState(false);
    return (
        <Dialog open={policyOpen} onOpenChange={setPolicyOpen}>
            <DialogTrigger asChild>
                <Button
                    className="fixed right-4 bottom-6 z-40 rounded-full shadow-md bg-sky-600 hover:bg-sky-700 cursor-pointer"
                    variant="default"
                    size="lg"
                >
                    Resort Policies
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl w-[100%]">
                <DialogHeader>
                    <DialogTitle>Resort Policies</DialogTitle>
                    <DialogDescription>
                        Please review our policies before making a reservation.
                    </DialogDescription>
                </DialogHeader>
                <Tabs defaultValue="child" className="w-full mt-6">
                    <TabsList className="grid grid-cols-5 mb-4">
                        <TabsTrigger value="child">Child</TabsTrigger>
                        <TabsTrigger value="accommodation">Rooms</TabsTrigger>
                        <TabsTrigger value="resort">Resort</TabsTrigger>
                        <TabsTrigger value="reminders">Reminders</TabsTrigger>
                        <TabsTrigger value="pet">Pet</TabsTrigger>
                    </TabsList>
                    <TabsContent value="child">
                        {/* Replace with real policy text */}
                        <p className="text-sm leading-relaxed">
                            Children aged 7 and below are free of charge when sharing beds with
                            parents. We do not provide extra beds or cribs.
                        </p>
                    </TabsContent>
                    <TabsContent value="accommodation">
                        <p className="text-sm leading-relaxed">
                            Check-in time is 3:00 PM; check-out is 12:00 PM. Early check-in or
                            late check-out is subject to availability and may incur charges.
                        </p>
                    </TabsContent>
                    <TabsContent value="resort">
                        <p className="text-sm leading-relaxed">
                            Proper swimwear is required in the pool area. Outside food and
                            beverage are not allowed.
                        </p>
                    </TabsContent>
                    <TabsContent value="reminders">
                        <p className="text-sm leading-relaxed">
                            Quiet hours are from 10:00 PM to 7:00 AM. Please respect other
                            guests.
                        </p>
                    </TabsContent>
                    <TabsContent value="pet">
                        <p className="text-sm leading-relaxed">
                            Small pets (up to 10 kg) are allowed in designated rooms only, with
                            a cleaning fee per stay. Pets must be on a leash in common areas.
                        </p>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    )
}

export default ResortPolicyDialog