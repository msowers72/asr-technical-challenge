"use client";

import { useState } from "react";
import { useRecords } from "../context/RecordsContext";


import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

import type { RecordItem, RecordStatus } from "../types";

interface RecordDetailDialogProps {
  record: RecordItem;
  onClose: () => void;
}

/**
 * RecordDetailDialog allows reviewers to inspect a specimen’s details and
 * update its status and accompanying note in a focused modal flow. Review
 * actions are performed via the Status dropdown, while the note captures
 * rationale or extra context for the change.
 */
export default function RecordDetailDialog({
  record,
  onClose,
}: RecordDetailDialogProps) {
  const [status, setStatus] = useState<RecordStatus>(record.status);
  const [note, setNote] = useState<string>(record.note ?? "");
  const { updateRecord } = useRecords();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const statusOptions: RecordStatus[] = [
    "pending",
    "approved",
    "flagged",
    "needs_revision",
  ];

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg tracking-tight">
            {record.name}
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            {record.description}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <Select
              value={status}
              onValueChange={(value) => setStatus(value as RecordStatus)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Reviewer note
            </label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note..."
              className="min-h-24"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Notes help other reviewers understand decisions.
            </p>
          </div>
        </div>
        {error && (
          <p className="text-sm text-destructive mt-2">
            {error}
          </p>
        )}

        <DialogFooter className="mt-6">
    <Button
      variant="default"
      disabled={saving}
      onClick={async () => {
        setError(null);

        // Validation rules
        const needsNote = status === "flagged" || status === "needs_revision";
        if (needsNote && note.trim() === "") {
          setError("A note is required for flagged or needs revision.");
          return;
        }

        try {
          setSaving(true);
          await updateRecord(record.id, { status, note });
          onClose(); // close only on success
        } catch {
          setError("Failed to save changes.");
        } finally {
          setSaving(false);
        }
      }}
    >
      {saving ? "Saving..." : "Save"}
  </Button>

          
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
