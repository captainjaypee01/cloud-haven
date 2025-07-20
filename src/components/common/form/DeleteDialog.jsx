// components/admin/forms/DeleteDialog.jsx
import React from "react";
import {
    AlertDialog,
    AlertDialogTrigger,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogFooter,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogCancel,
    AlertDialogAction
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

const DeleteDialog = ({ open, onOpenChange, onConfirm, title = "Delete", description = "Are you sure?" }) => (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>{title}</AlertDialogTitle>
                <AlertDialogDescription>{description}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel asChild>
                    <Button variant="outline" className="cursor-pointer">Cancel</Button>
                </AlertDialogCancel>
                <AlertDialogAction asChild>
                    <Button variant="destructive" className="cursor-pointer" onClick={onConfirm}>
                        Delete
                    </Button>
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
);

export default DeleteDialog;
