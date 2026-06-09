"use client"

import { FormEvent, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

export interface EditorProject {
  id: string
  name: string
  slug: string
  ownership: "owned" | "collaborator"
}

interface ProjectDialogsProps {
  createOpen: boolean
  renameProject: EditorProject | null
  deleteProject: EditorProject | null
  onCreateOpenChange: (open: boolean) => void
  onRenameOpenChange: (open: boolean) => void
  onDeleteOpenChange: (open: boolean) => void
  onCreateProject: (name: string, slug: string) => void
  onRenameProject: (projectId: string, name: string, slug: string) => void
  onDeleteProject: (projectId: string) => void
}

export function ProjectDialogs({
  createOpen,
  renameProject,
  deleteProject,
  onCreateOpenChange,
  onRenameOpenChange,
  onDeleteOpenChange,
  onCreateProject,
  onRenameProject,
  onDeleteProject,
}: ProjectDialogsProps) {
  return (
    <>
      {createOpen && (
        <CreateProjectDialog
          onOpenChange={onCreateOpenChange}
          onCreateProject={onCreateProject}
        />
      )}
      {renameProject && (
        <RenameProjectDialog
          key={renameProject.id}
          project={renameProject}
          onOpenChange={onRenameOpenChange}
          onRenameProject={onRenameProject}
        />
      )}
      {deleteProject && (
        <DeleteProjectDialog
          project={deleteProject}
          onOpenChange={onDeleteOpenChange}
          onDeleteProject={onDeleteProject}
        />
      )}
    </>
  )
}

interface CreateProjectDialogProps {
  onOpenChange: (open: boolean) => void
  onCreateProject: (name: string, slug: string) => void
}

function CreateProjectDialog({
  onOpenChange,
  onCreateProject,
}: CreateProjectDialogProps) {
  const [createName, setCreateName] = useState("")
  const createSlug = createSlugFromName(createName)

  function handleCreateSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const name = createName.trim()
    if (!name) {
      return
    }

    onCreateProject(name, createSlug)
    onOpenChange(false)
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
              onChange={(event) => setCreateName(event.target.value)}
              placeholder="Realtime checkout system"
              autoFocus
            />
          </div>

          <div className="bg-subtle px-3 py-2 border border-surface-border rounded-xl">
            <p className="text-copy-muted text-xs">Slug preview</p>
            <p className="mt-1 font-mono text-copy-primary text-sm">
              {createSlug || "project-slug"}
            </p>
          </div>

          <DialogFooter className="bg-subtle/70 -mx-6 -mb-6 border-surface-border rounded-b-3xl">
            <DialogClose render={<Button variant="outline" type="button" />}>
              Cancel
            </DialogClose>
            <Button type="submit" disabled={!createName.trim()}>
              Create Project
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

interface RenameProjectDialogProps {
  project: EditorProject
  onOpenChange: (open: boolean) => void
  onRenameProject: (projectId: string, name: string, slug: string) => void
}

function RenameProjectDialog({
  project,
  onOpenChange,
  onRenameProject,
}: RenameProjectDialogProps) {
  const [renameName, setRenameName] = useState(project.name)
  const renameSlug = createSlugFromName(renameName)

  function handleRenameSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const name = renameName.trim()
    if (!name) {
      return
    }

    onRenameProject(project.id, name, renameSlug)
    onOpenChange(false)
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
              onChange={(event) => setRenameName(event.target.value)}
              autoFocus
            />
          </div>

          <div className="bg-subtle px-3 py-2 border border-surface-border rounded-xl">
            <p className="text-copy-muted text-xs">Slug preview</p>
            <p className="mt-1 font-mono text-copy-primary text-sm">
              {renameSlug || "project-slug"}
            </p>
          </div>

          <DialogFooter className="bg-subtle/70 -mx-6 -mb-6 border-surface-border rounded-b-3xl">
            <DialogClose render={<Button variant="outline" type="button" />}>
              Cancel
            </DialogClose>
            <Button type="submit" disabled={!renameName.trim()}>
              Rename Project
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

interface DeleteProjectDialogProps {
  project: EditorProject
  onOpenChange: (open: boolean) => void
  onDeleteProject: (projectId: string) => void
}

function DeleteProjectDialog({
  project,
  onOpenChange,
  onDeleteProject,
}: DeleteProjectDialogProps) {
  function handleDeleteConfirm() {
    onDeleteProject(project.id)
    onOpenChange(false)
  }

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="gap-5 bg-elevated p-6 border border-surface-border rounded-3xl sm:max-w-md text-copy-primary">
        <DialogHeader>
          <DialogTitle className="text-lg">Delete Project</DialogTitle>
          <DialogDescription>
            Delete {project.name}? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="bg-subtle/70 -mx-6 -mb-6 border-surface-border rounded-b-3xl">
          <DialogClose render={<Button variant="outline" type="button" />}>
            Cancel
          </DialogClose>
          <Button
            variant="destructive"
            type="button"
            onClick={handleDeleteConfirm}
          >
            Delete Project
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function createSlugFromName(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}
