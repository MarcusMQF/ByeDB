"use client";

import * as React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/alert-dialog";
import { Button } from "@/components/button";

interface ConfirmationDialogProps {
  title: string;
  description: string;
  cancelText?: string;
  confirmText?: string;
  onConfirm: () => void;
  trigger?: React.ReactNode;
  variant?: "default" | "destructive";
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ConfirmationDialog({
  title,
  description,
  cancelText = "Cancel",
  confirmText = "Continue",
  onConfirm,
  trigger,
  variant = "default",
  open,
  onOpenChange,
}: ConfirmationDialogProps) {
  const handleConfirm = () => {
    onConfirm();
  };

  const alertDialog = (
    <AlertDialogContent className="bg-white rounded-lg border-none shadow-lg max-w-md">
      <AlertDialogHeader>
        <AlertDialogTitle className="text-xl font-semibold text-gray-900">
          {title}
        </AlertDialogTitle>
        <AlertDialogDescription className="text-gray-600 mt-2">
          {description}
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter className="mt-6 flex justify-end gap-3">
        <AlertDialogCancel asChild>
          <Button
            variant="outline"
            className="rounded-md border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
          >
            {cancelText}
          </Button>
        </AlertDialogCancel>
        <AlertDialogAction asChild>
          <Button
            variant="default"
            className="rounded-md bg-black hover:bg-gray-800 text-white"
            onClick={handleConfirm}
          >
            {confirmText}
          </Button>
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  );

  // If open state is controlled externally
  if (open !== undefined) {
    return (
      <AlertDialog open={open} onOpenChange={onOpenChange}>
        {trigger && <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>}
        {alertDialog}
      </AlertDialog>
    );
  }

  // Default uncontrolled behavior
  return (
    <AlertDialog>
      {trigger && <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>}
      {alertDialog}
    </AlertDialog>
  );
} 