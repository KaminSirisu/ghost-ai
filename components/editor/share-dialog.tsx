"use client";

import { FormEvent, useEffect, useState } from "react";
import { Copy, Trash2, UserRound } from "lucide-react";

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
import { ScrollArea } from "@/components/ui/scroll-area";

interface Collaborator {
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
}

interface CollaboratorsResponse {
  collaborators?: Collaborator[];
  canManage?: boolean;
  error?: string;
}

interface ShareDialogProps {
  canManageAccess: boolean;
  open: boolean;
  projectId: string;
  projectName: string;
  onOpenChange: (open: boolean) => void;
}

async function readCollaboratorsResponse(response: Response) {
  try {
    return (await response.json()) as CollaboratorsResponse;
  } catch {
    return {};
  }
}

export function ShareDialog({
  canManageAccess,
  open,
  projectId,
  projectName,
  onOpenChange,
}: ShareDialogProps) {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const projectUrl =
    typeof window === "undefined"
      ? `/editor/${projectId}`
      : `${window.location.origin}/editor/${projectId}`;

  useEffect(() => {
    if (!open) {
      return;
    }

    let isActive = true;

    async function loadCollaborators() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/projects/${projectId}/collaborators`);
        const body = await readCollaboratorsResponse(response);

        if (!response.ok || !body.collaborators) {
          throw new Error(body.error || "Unable to load collaborators.");
        }

        if (isActive) {
          setCollaborators(body.collaborators);
        }
      } catch (loadError) {
        if (isActive) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load collaborators.",
          );
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    loadCollaborators();

    return () => {
      isActive = false;
    };
  }, [open, projectId]);

  useEffect(() => {
    if (!copied) {
      return;
    }

    const timeout = window.setTimeout(() => setCopied(false), 1600);
    return () => window.clearTimeout(timeout);
  }, [copied]);

  async function inviteCollaborator(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const inviteEmail = email.trim();
    if (!inviteEmail || isMutating) {
      return;
    }

    setIsMutating(true);
    setError(null);

    try {
      const response = await fetch(`/api/projects/${projectId}/collaborators`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail }),
      });
      const body = await readCollaboratorsResponse(response);

      if (!response.ok || !body.collaborators) {
        throw new Error(body.error || "Unable to invite collaborator.");
      }

      setCollaborators(body.collaborators);
      setEmail("");
    } catch (inviteError) {
      setError(
        inviteError instanceof Error
          ? inviteError.message
          : "Unable to invite collaborator.",
      );
    } finally {
      setIsMutating(false);
    }
  }

  async function removeCollaborator(collaboratorEmail: string) {
    if (isMutating) {
      return;
    }

    setIsMutating(true);
    setError(null);

    try {
      const response = await fetch(`/api/projects/${projectId}/collaborators`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: collaboratorEmail }),
      });
      const body = await readCollaboratorsResponse(response);

      if (!response.ok) {
        throw new Error(body.error || "Unable to remove collaborator.");
      }

      setCollaborators((current) =>
        current.filter((collaborator) => collaborator.email !== collaboratorEmail),
      );
    } catch (removeError) {
      setError(
        removeError instanceof Error
          ? removeError.message
          : "Unable to remove collaborator.",
      );
    } finally {
      setIsMutating(false);
    }
  }

  async function copyProjectLink() {
    try{
      await navigator.clipboard.writeText(projectUrl);
      setCopied(true);
    } catch (err) {
      console.error('Error:', err)
    }
    
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-5 bg-elevated p-6 border border-surface-border rounded-3xl sm:max-w-lg text-copy-primary">
        <DialogHeader>
          <DialogTitle className="text-lg">Share {projectName}</DialogTitle>
          <DialogDescription>
            Manage collaborator access for this project workspace.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="space-y-2">
            <label
              htmlFor="project-link"
              className="font-medium text-copy-secondary text-sm"
            >
              Project link
            </label>
            <div className="flex gap-2">
              <Input
                id="project-link"
                value={projectUrl}
                readOnly
                className="font-mono text-copy-primary"
              />
              <Button
                type="button"
                variant="outline"
                onClick={copyProjectLink}
                aria-label="Copy project link"
              >
                <Copy />
                {copied ? "Copied!" : "Copy"}
              </Button>
            </div>
          </div>

          {canManageAccess && (
            <form className="space-y-2" onSubmit={inviteCollaborator}>
              <label
                htmlFor="collaborator-email"
                className="font-medium text-copy-secondary text-sm"
              >
                Invite collaborator
              </label>
              <div className="flex gap-2">
                <Input
                  id="collaborator-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="name@example.com"
                  className="text-copy-primary"
                />
                <Button type="submit" disabled={isMutating || !email.trim()}>
                  {isMutating ? "Inviting..." : "Invite"}
                </Button>
              </div>
            </form>
          )}

          <section className="space-y-3">
            <div>
              <h2 className="font-semibold text-copy-primary text-sm">
                Collaborators
              </h2>
              {!canManageAccess && (
                <p className="mt-1 text-copy-muted text-xs">
                  You can view collaborators, but only the owner can manage access.
                </p>
              )}
            </div>

            <ScrollArea className="bg-surface border border-surface-border rounded-2xl max-h-64">
              <div className="space-y-2 p-3">
                {isLoading ? (
                  <p className="p-3 text-copy-muted text-sm">
                    Loading collaborators...
                  </p>
                ) : collaborators.length === 0 ? (
                  <p className="p-3 text-copy-muted text-sm">
                    No collaborators yet.
                  </p>
                ) : (
                  collaborators.map((collaborator) => (
                    <div
                      key={collaborator.email}
                      className="flex items-center gap-3 bg-base/60 p-3 border border-surface-border rounded-2xl"
                    >
                      <CollaboratorAvatar collaborator={collaborator} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-copy-primary text-sm truncate">
                          {collaborator.displayName || collaborator.email}
                        </p>
                        {collaborator.displayName && (
                          <p className="text-copy-muted text-xs truncate">
                            {collaborator.email}
                          </p>
                        )}
                      </div>
                      {canManageAccess && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Remove ${collaborator.email}`}
                          disabled={isMutating}
                          onClick={() => removeCollaborator(collaborator.email)}
                        >
                          <Trash2 />
                        </Button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </section>

          {error && <p className="text-destructive text-sm">{error}</p>}
        </div>

        <DialogFooter className="bg-subtle/70 -mx-6 -mb-6 border-surface-border rounded-b-3xl">
          <DialogClose render={<Button variant="outline" type="button" />}>
            Close
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CollaboratorAvatar({
  collaborator,
}: {
  collaborator: Collaborator;
}) {
  if (collaborator.avatarUrl) {
    return (
      <span
        aria-hidden="true"
        className="bg-cover bg-center border border-surface-border rounded-xl size-10"
        style={{ backgroundImage: `url(${collaborator.avatarUrl})` }}
      />
    );
  }

  return (
    <div className="flex justify-center items-center bg-subtle border border-surface-border rounded-xl size-10 text-copy-muted">
      <UserRound className="w-4 h-4" aria-hidden="true" />
    </div>
  );
}
