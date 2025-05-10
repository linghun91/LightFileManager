"use client";

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface CreateFolderDialogProps {
  currentPath: string;
  onClose: () => void;
  onCreate: (folderName: string) => void;
}

export const CreateFolderDialog: React.FC<CreateFolderDialogProps> = ({ currentPath, onClose, onCreate }) => {
  const [folderName, setFolderName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (folderName.trim()) {
      onCreate(folderName.trim());
      onClose();
    }
  };

  return (
    <Dialog open={true} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
            <DialogDescription>
              Enter a name for the new folder in {currentPath === '/' ? 'root' : `"${currentPath}"`}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="folderName" className="text-right">
                Name
              </Label>
              <Input
                id="folderName"
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                className="col-span-3"
                autoFocus
                required
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={!folderName.trim()}>Create Folder</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
