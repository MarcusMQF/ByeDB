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
            className={`
              relative overflow-hidden rounded-md
              bg-gradient-to-r from-gray-900 to-black 
              hover:from-gray-800 hover:to-gray-900
              text-white font-medium
              border border-gray-700
              shadow-lg hover:shadow-xl
              transition-all duration-300 ease-out
              focus:outline-none
              group
            `}
            onClick={handleConfirm}
          >
            <span className="relative z-10">{confirmText}</span>
            {/* Shine effect overlay */}
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:translate-x-full transition-transform duration-700 ease-out" />
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