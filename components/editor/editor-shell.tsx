"use client";

import { useState } from "react";

import { EditorNavbar } from "@/components/editor/editor-navbar";
import { ProjectSiderbar } from "@/components/editor/project-siderbar";
import {
  EditorProject,
  ProjectDialogs,
  createSlugFromName,
} from "@/components/editor/project-dialogs";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export function EditorShell() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [projects, setProjects] = useState<EditorProject[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [renameProject, setRenameProject] = useState<EditorProject | null>(
    null
  );
  const [deleteProject, setDeleteProject] = useState<EditorProject | null>(
    null
  );

  const ownedProjects = projects.filter(
    (project) => project.ownership === "owned"
  );
  const sharedProjects = projects.filter(
    (project) => project.ownership === "collaborator"
  );

  function handleCreateProject(name: string, slug: string) {
    const project: EditorProject = {
      id: crypto.randomUUID(),
      name,
      slug,
      ownership: "owned",
    };

    setProjects((currentProjects) => [project, ...currentProjects]);
    setActiveProjectId(project.id);
  }

  function handleRenameProject(projectId: string, name: string, slug: string) {
    setProjects((currentProjects) =>
      currentProjects.map((project) =>
        project.id === projectId ? { ...project, name, slug } : project
      )
    );
  }

  function handleDeleteProject(projectId: string) {
    setProjects((currentProjects) =>
      currentProjects.filter((project) => project.id !== projectId)
    );

    if (activeProjectId === projectId) {
      setActiveProjectId(null);
    }
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
        onNewProject={() => setIsCreateOpen(true)}
        onSelectProject={(projectId) => {
          setActiveProjectId(projectId);
          setIsSidebarOpen(false);
        }}
        onRenameProject={setRenameProject}
        onDeleteProject={setDeleteProject}
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
            onClick={() => setIsCreateOpen(true)}
          >
            <Plus />
            New Project
          </Button>
        </div>
      </section>
      <ProjectDialogs
        createOpen={isCreateOpen}
        renameProject={renameProject}
        deleteProject={deleteProject}
        onCreateOpenChange={setIsCreateOpen}
        onRenameOpenChange={(open) => {
          if (!open) {
            setRenameProject(null);
          }
        }}
        onDeleteOpenChange={(open) => {
          if (!open) {
            setDeleteProject(null);
          }
        }}
        onCreateProject={(name, slug) =>
          handleCreateProject(name, slug || createSlugFromName(name))
        }
        onRenameProject={(projectId, name, slug) =>
          handleRenameProject(projectId, name, slug || createSlugFromName(name))
        }
        onDeleteProject={handleDeleteProject}
      />
    </main>
  );
}
