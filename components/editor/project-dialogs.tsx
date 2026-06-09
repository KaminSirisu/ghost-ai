"use client";

import { FormEvent } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { EditorProject } from "@/lib/project-types";

interface ProjectDialogsProps {
  createName: string;
  createOpen: boolean;
  createRoomId: string;
  deleteProject: EditorProject | null;
  isMutating: boolean;
  mutationError: string | null;
  renameName: string;
  renameProject: EditorProject | null;
  onCreateNameChange: (name: string) => void;
  onCreateOpenChange: (open: boolean) => void;
  onCreateProject: () => void;
  onDeleteOpenChange: (open: boolean) => void;
  onDeleteProject: () => void;
  onRenameNameChange: (name: string) => void;
  onRenameOpenChange: (open: boolean) => void;
  onRenameProject: () => void;
}

export function ProjectDialogs({
  createName,
  createOpen,
  createRoomId,
  deleteProject,
  isMutating,
  mutationError,
  renameName,
  renameProject,
  onCreateNameChange,
  onCreateOpenChange,
  onCreateProject,
  onDeleteOpenChange,
  onDeleteProject,
  onRenameNameChange,
  onRenameOpenChange,
  onRenameProject,
}: ProjectDialogsProps) {
  return (
    <>
      {createOpen && (
        <CreateProjectDialog
          createName={createName}
          roomId={createRoomId}
          isMutating={isMutating}
          mutationError={mutationError}
          onNameChange={onCreateNameChange}
          onOpenChange={onCreateOpenChange}
          onCreateProject={onCreateProject}
        />
      )}
      {renameProject && (
        <RenameProjectDialog
          key={renameProject.id}
          project={renameProject}
          renameName={renameName}
          isMutating={isMutating}
          mutationError={mutationError}
          onNameChange={onRenameNameChange}
          onOpenChange={onRenameOpenChange}
          onRenameProject={onRenameProject}
        />
      )}
      {deleteProject && (
        <DeleteProjectDialog
          project={deleteProject}
          isMutating={isMutating}
          mutationError={mutationError}
          onOpenChange={onDeleteOpenChange}
          onDeleteProject={onDeleteProject}
        />
      )}
    </>
  );
}

interface CreateProjectDialogProps {
  createName: string;
  roomId: string;
  isMutating: boolean;
  mutationError: string | null;
  onNameChange: (name: string) => void;
  onOpenChange: (open: boolean) => void;
  onCreateProject: () => void;
}

function CreateProjectDialog({
  createName,
  roomId,
  isMutating,
  mutationError,
  onNameChange,
  onOpenChange,
  onCreateProject,
}: CreateProjectDialogProps) {
  function handleCreateSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onCreateProject();
  }

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="gap-5 bg-elevated p-6 border border-surface-border rounded-3xl sm:max-w-md text-copy-primary">
        <DialogHeader>
          <DialogTitle className="text-lg">Create Project</DialogTitle>
          <DialogDescription>
            Name the architecture workspace before opening the canvas.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-5" onSubmit={handleCreateSubmit}>
          <div className="space-y-2">
            <label
              htmlFor="create-project-name"
              className="font-medium text-copy-secondary text-sm"
            >
              Project name
            </label>
            <Input
              id="create-project-name"
              className="text-copy-primary"
              value={createName}
              onChange={(event) => onNameChange(event.target.value)}
              placeholder="Realtime checkout system"
              autoFocus
            />
          </div>

          <div className="bg-subtle px-3 py-2 border border-surface-border rounded-xl">
            <p className="text-copy-muted text-xs">Room ID preview</p>
            <p className="mt-1 font-mono text-copy-primary text-sm">
              {roomId}
            </p>
          </div>

          {mutationError && (
            <p className="text-destructive text-sm">{mutationError}</p>
          )}

          <DialogFooter className="bg-subtle/70 -mx-6 -mb-6 border-surface-border rounded-b-3xl">
            <DialogClose render={<Button variant="outline" type="button" />}>
              Cancel
            </DialogClose>
            <Button type="submit" disabled={isMutating}>
              {isMutating ? "Creating..." : "Create Project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface RenameProjectDialogProps {
  project: EditorProject;
  renameName: string;
  isMutating: boolean;
  mutationError: string | null;
  onNameChange: (name: string) => void;
  onOpenChange: (open: boolean) => void;
  onRenameProject: () => void;
}

function RenameProjectDialog({
  project,
  renameName,
  isMutating,
  mutationError,
  onNameChange,
  onOpenChange,
  onRenameProject,
}: RenameProjectDialogProps) {
  function handleRenameSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onRenameProject();
  }

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="gap-5 bg-elevated p-6 border border-surface-border rounded-3xl sm:max-w-md text-copy-primary">
        <DialogHeader>
          <DialogTitle className="text-lg">Rename Project</DialogTitle>
          <DialogDescription>
            Current project name: {project.name}
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-5" onSubmit={handleRenameSubmit}>
          <div className="space-y-2">
            <label
              htmlFor="rename-project-name"
              className="font-medium text-copy-secondary text-sm"
            >
              Project name
            </label>
            <Input
              id="rename-project-name"
              className="text-copy-primary"
              value={renameName}
              onChange={(event) => onNameChange(event.target.value)}
              autoFocus
            />
          </div>

          {mutationError && (
            <p className="text-destructive text-sm">{mutationError}</p>
          )}

          <DialogFooter className="bg-subtle/70 -mx-6 -mb-6 border-surface-border rounded-b-3xl">
            <DialogClose render={<Button variant="outline" type="button" />}>
              Cancel
            </DialogClose>
            <Button type="submit" disabled={isMutating || !renameName.trim()}>
              {isMutating ? "Renaming..." : "Rename Project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface DeleteProjectDialogProps {
  project: EditorProject;
  isMutating: boolean;
  mutationError: string | null;
  onOpenChange: (open: boolean) => void;
  onDeleteProject: () => void;
}

function DeleteProjectDialog({
  project,
  isMutating,
  mutationError,
  onOpenChange,
  onDeleteProject,
}: DeleteProjectDialogProps) {
  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="gap-5 bg-elevated p-6 border border-surface-border rounded-3xl sm:max-w-md text-copy-primary">
        <DialogHeader>
          <DialogTitle className="text-lg">Delete Project</DialogTitle>
          <DialogDescription>
            Delete {project.name}? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        {mutationError && (
          <p className="text-destructive text-sm">{mutationError}</p>
        )}

        <DialogFooter className="bg-subtle/70 -mx-6 -mb-6 border-surface-border rounded-b-3xl">
          <DialogClose render={<Button variant="outline" type="button" />}>
            Cancel
          </DialogClose>
          <Button
            variant="destructive"
            type="button"
            onClick={onDeleteProject}
            disabled={isMutating}
          >
            {isMutating ? "Deleting..." : "Delete Project"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
