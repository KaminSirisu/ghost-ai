"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { EditorProject } from "@/lib/project-types";

const DEFAULT_PROJECT_NAME = "Untitled Project";

interface ProjectMutationResponse {
  project?: {
    id: string;
    name: string;
  };
  error?: string;
}

function createShortSuffix() {
  const values = new Uint32Array(1);
  crypto.getRandomValues(values);
  return values[0].toString(36).slice(0, 5).padStart(5, "0");
}

function slugifyProjectName(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function readProjectMutationResponse(response: Response) {
  try {
    return (await response.json()) as ProjectMutationResponse;
  } catch {
    return {};
  }
}

export function useProjectActions(activeProjectId: string | null) {
  const router = useRouter();
  const pathname = usePathname();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createSuffix, setCreateSuffix] = useState(createShortSuffix);
  const [renameProject, setRenameProject] = useState<EditorProject | null>(
    null,
  );
  const [renameName, setRenameName] = useState("");
  const [deleteProject, setDeleteProject] = useState<EditorProject | null>(
    null,
  );
  const [isMutating, setIsMutating] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);

  const createRoomId = useMemo(() => {
    const slug = slugifyProjectName(createName) || "untitled-project";
    return `${slug}-${createSuffix}`;
  }, [createName, createSuffix]);

  function openCreateDialog() {
    setMutationError(null);
    setCreateName("");
    setCreateSuffix(createShortSuffix());
    setIsCreateOpen(true);
  }

  function setCreateOpen(open: boolean) {
    setIsCreateOpen(open);

    if (!open) {
      setMutationError(null);
      setCreateName("");
    }
  }

  function openRenameDialog(project: EditorProject) {
    setMutationError(null);
    setRenameProject(project);
    setRenameName(project.name);
  }

  function setRenameOpen(open: boolean) {
    if (!open) {
      setMutationError(null);
      setRenameProject(null);
      setRenameName("");
    }
  }

  function openDeleteDialog(project: EditorProject) {
    setMutationError(null);
    setDeleteProject(project);
  }

  function setDeleteOpen(open: boolean) {
    if (!open) {
      setMutationError(null);
      setDeleteProject(null);
    }
  }

  function selectProject(projectId: string) {
    router.push(`/editor/${projectId}`);
  }

  async function createProject() {
    if (isMutating) {
      return;
    }

    const name = createName.trim() || DEFAULT_PROJECT_NAME;
    setIsMutating(true);
    setMutationError(null);

    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: createRoomId, name }),
      });
      const body = await readProjectMutationResponse(response);

      if (!response.ok || !body.project) {
        throw new Error(body.error || "Unable to create project.");
      }

      setIsCreateOpen(false);
      router.push(`/editor/${body.project.id}`);
    } catch (error) {
      setMutationError(
        error instanceof Error ? error.message : "Unable to create project.",
      );
    } finally {
      setIsMutating(false);
    }
  }

  async function renameSelectedProject() {
    if (isMutating || !renameProject) {
      return;
    }

    const name = renameName.trim();
    if (!name) {
      return;
    }

    setIsMutating(true);
    setMutationError(null);

    try {
      const response = await fetch(`/api/projects/${renameProject.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const body = await readProjectMutationResponse(response);

      if (!response.ok) {
        throw new Error(body.error || "Unable to rename project.");
      }

      setRenameProject(null);
      setRenameName("");
      router.refresh();
    } catch (error) {
      setMutationError(
        error instanceof Error ? error.message : "Unable to rename project.",
      );
    } finally {
      setIsMutating(false);
    }
  }

  async function deleteSelectedProject() {
    if (isMutating || !deleteProject) {
      return;
    }

    setIsMutating(true);
    setMutationError(null);

    try {
      const response = await fetch(`/api/projects/${deleteProject.id}`, {
        method: "DELETE",
      });
      const body = await readProjectMutationResponse(response);

      if (!response.ok) {
        throw new Error(body.error || "Unable to delete project.");
      }

      const deletedProjectId = deleteProject.id;
      setDeleteProject(null);

      if (activeProjectId === deletedProjectId || pathname === `/editor/${deletedProjectId}`) {
        router.push("/editor");
        return;
      }

      router.refresh();
    } catch (error) {
      setMutationError(
        error instanceof Error ? error.message : "Unable to delete project.",
      );
    } finally {
      setIsMutating(false);
    }
  }

  return {
    createName,
    createOpen: isCreateOpen,
    createRoomId,
    deleteProject,
    isMutating,
    mutationError,
    renameName,
    renameProject,
    createProject,
    deleteSelectedProject,
    openCreateDialog,
    openDeleteDialog,
    openRenameDialog,
    renameSelectedProject,
    selectProject,
    setCreateName,
    setCreateOpen,
    setDeleteOpen,
    setRenameName,
    setRenameOpen,
  };
}
