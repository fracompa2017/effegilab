"use client";

import type { ReactNode } from "react";

import { X } from "lucide-react";

import { Button } from "@/components/ui/Button";

type ModalProps = {
  isOpen: boolean;
  title?: string;
  onClose: () => void;
  children: ReactNode;
};

export function Modal({ isOpen, title, onClose, children }: ModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title ?? "Modale"}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900">{title ?? "Dettagli"}</h2>
          <Button variant="ghost" onClick={onClose} aria-label="Chiudi modale">
            <X size={18} />
          </Button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
}
