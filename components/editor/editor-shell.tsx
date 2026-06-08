"use client";

import { useState } from "react";

import { EditorNavbar } from "@/components/editor/editor-navbar";
import { ProjectSiderbar } from "@/components/editor/project-siderbar";

export function EditorShell() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <main className="min-h-screen bg-base pt-14 text-copy-primary">
      <EditorNavbar
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((isOpen) => !isOpen)}
      />
      <ProjectSiderbar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      <section className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-6 text-center">
        <div>
          <p className="font-semibold text-copy-primary text-sm">Editor</p>
          <p className="mt-2 max-w-md text-copy-muted text-sm">
            Project canvas integration will extend this protected workspace.
          </p>
        </div>
      </section>
    </main>
  );
}
