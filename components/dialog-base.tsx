import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";

const DialogBase = ({
  open,
  openChangeAction,
  header,
  description,
  children,
  className,
}: {
  open: boolean;
  openChangeAction: (open: boolean) => void;
  header?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <Dialog open={open} onOpenChange={openChangeAction}>
      <DialogContent
        className={className}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {header && (
          <DialogHeader>
            <DialogTitle>{header}</DialogTitle>
            {description && (
              <DialogDescription>{description}</DialogDescription>
            )}
          </DialogHeader>
        )}
        {children}
      </DialogContent>
    </Dialog>
  );
};

export default DialogBase;
