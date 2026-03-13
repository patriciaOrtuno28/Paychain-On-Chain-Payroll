"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface DeleteCompanyButtonProps {
  companyName: string;
  onDeleteCompany: () => Promise<void>;
}

/**
 * Renders a delete-company control with a two-step confirmation:
 *  1. Click "Delete Company" → inline panel expands.
 *  2. User types the company name exactly, then clicks "Confirm Permanent Deletion".
 * This prevents accidental deletion of the company and all its data.
 */
export function DeleteCompanyButton({ companyName, onDeleteCompany }: DeleteCompanyButtonProps) {
  const [expanded, setExpanded] = useState(false);
  const [confirmInput, setConfirmInput] = useState("");
  const [deleting, setDeleting] = useState(false);

  const isConfirmed = confirmInput.trim() === companyName.trim();

  async function handleConfirm() {
    if (!isConfirmed) return;
    setDeleting(true);
    try {
      await onDeleteCompany();
    } finally {
      setDeleting(false);
      setExpanded(false);
      setConfirmInput("");
    }
  }

  function handleCancel() {
    setExpanded(false);
    setConfirmInput("");
  }

  return (
    <div className="mt-6 border border-destructive/30 rounded p-4 bg-destructive/5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-destructive-foreground uppercase tracking-wider">
            Danger Zone
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Permanently deactivate the payroll contract and erase all company data from Supabase.
            This action cannot be undone.
          </p>
        </div>
        {!expanded && (
          <Button
            variant="destructive"
            size="sm"
            className="shrink-0 ml-4 bg-destructive/80 hover:bg-destructive text-destructive-foreground h-8 px-3 text-xs"
            onClick={() => setExpanded(true)}
          >
            <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete Company
          </Button>
        )}
      </div>

      {expanded && (
        <div className="mt-4 space-y-3 border-t border-destructive/20 pt-4">
          <p className="text-xs text-destructive-foreground font-medium">
            This will permanently:
          </p>
          <ul className="text-xs text-muted-foreground list-disc pl-4 space-y-0.5">
            <li>Deactivate the on-chain Payroll contract (blocks all future payroll runs)</li>
            <li>Remove the company from the factory registry</li>
            <li>Erase all employee records, bindings and company data from Supabase</li>
          </ul>

          <div>
            <p className="text-xs text-muted-foreground mb-1.5">
              To confirm, type the company name: <span className="font-semibold text-foreground">{companyName}</span>
            </p>
            <Input
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              placeholder={companyName}
              className="bg-background border-destructive/40 text-foreground h-8 text-xs font-mono"
              disabled={deleting}
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant="destructive"
              size="sm"
              disabled={!isConfirmed || deleting}
              onClick={handleConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 h-8 px-4 text-xs disabled:opacity-40"
            >
              {deleting ? (
                <span className="flex items-center gap-1.5">
                  <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Deleting…
                </span>
              ) : (
                "Confirm Permanent Deletion"
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              disabled={deleting}
              className="h-8 px-4 text-xs border-border text-muted-foreground hover:bg-accent"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
