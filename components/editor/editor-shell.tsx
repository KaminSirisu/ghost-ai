"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { EditorNavbar } from "@/components/editor/editor-navbar";
import { ProjectDialogs } from "@/components/editor/project-dialogs";
import { ProjectSiderbar } from "@/components/editor/project-siderbar";
import { Button } from "@/components/ui/button";
import { useProjectActions } from "@/hooks/use-project-actions";
import { EditorProject } from "@/lib/project-types";

interface EditorShellProps {
  activeProjectId: string | null;
  ownedProjects: EditorProject[];
  sharedProjects: EditorProject[];
}

export function EditorShell({
  activeProjectId,
  ownedProjects,
  sharedProjects,
}: EditorShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const projectActions = useProjectActions(activeProjectId);

  function selectProject(projectId: string) {
    projectActions.selectProject(projectId);
    setIsSidebarOpen(false);
  }

  return (
    <main className="min-h-screen bg-base pt-14 text-copy-primary">
      <EditorNavbar
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((isOpen) => !isOpen)}
      />
      <ProjectSiderbar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        ownedProjects={ownedProjects}
        sharedProjects={sharedProjects}
        activeProjectId={activeProjectId}
        onNewProject={projectActions.openCreateDialog}
        onSelectProject={selectProject}
        onRenameProject={projectActions.openRenameDialog}
        onDeleteProject={projectActions.openDeleteDialog}
      />
      <section className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-6 text-center">
        <div className="max-w-xl">
          <h1 className="font-semibold text-3xl text-copy-primary tracking-normal sm:text-4xl">
            Create a project or open an existing one
          </h1>
          <p className="mx-auto mt-3 max-w-md text-copy-muted text-sm leading-6">
            Start a new architecture workspace, or choose a project from the
            sidebar.
          </p>
          <Button
            className="mt-7"
            size="lg"
            type="button"
            onClick={projectActions.openCreateDialog}
          >
            <Plus />
            New Project
          </Button>
        </div>
      </section>
      <ProjectDialogs
        createName={projectActions.createName}
        createOpen={projectActions.createOpen}
        createRoomId={projectActions.createRoomId}
        deleteProject={projectActions.deleteProject}
        isMutating={projectActions.isMutating}
        mutationError={projectActions.mutationError}
        renameName={projectActions.renameName}
        renameProject={projectActions.renameProject}
        onCreateNameChange={projectActions.setCreateName}
        onCreateOpenChange={projectActions.setCreateOpen}
        onCreateProject={projectActions.createProject}
        onDeleteOpenChange={projectActions.setDeleteOpen}
        onDeleteProject={projectActions.deleteSelectedProject}
        onRenameNameChange={projectActions.setRenameName}
        onRenameOpenChange={projectActions.setRenameOpen}
        onRenameProject={projectActions.renameSelectedProject}
      />
    </main>
  );
}
