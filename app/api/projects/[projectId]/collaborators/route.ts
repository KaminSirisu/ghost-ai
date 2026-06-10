import { getCurrentClerkIdentity, getProjectForUserAccess, userOwnsProject } from "@/lib/project-access";
import {
  getProjectCollaboratorProfiles,
  inviteProjectCollaborator,
  normalizeCollaboratorEmail,
  removeProjectCollaborator,
} from "@/lib/project-collaborators";

interface CollaboratorsRouteContext {
  params: Promise<{
    projectId: string;
  }>;
}

interface CollaboratorMutationRequest {
  email?: unknown;
}

function unauthorized() {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}

function forbidden() {
  return Response.json({ error: "Forbidden" }, { status: 403 });
}

async function readCollaboratorMutationRequest(request: Request) {
  try {
    return (await request.json()) as CollaboratorMutationRequest;
  } catch {
    return {};
  }
}

export async function GET(
  _request: Request,
  context: CollaboratorsRouteContext,
) {
  const { projectId } = await context.params;
  const identity = await getCurrentClerkIdentity();

  if (!identity.userId) {
    return unauthorized();
  }

  const project = await getProjectForUserAccess({
    projectId,
    userId: identity.userId,
    primaryEmail: identity.primaryEmail,
  });

  if (!project) {
    return forbidden();
  }

  const collaborators = await getProjectCollaboratorProfiles(projectId);

  return Response.json({
    collaborators,
    canManage: project.ownerId === identity.userId,
  });
}

export async function POST(
  request: Request,
  context: CollaboratorsRouteContext,
) {
  const { projectId } = await context.params;
  const identity = await getCurrentClerkIdentity();

  if (!identity.userId) {
    return unauthorized();
  }

  if (!(await userOwnsProject(projectId, identity.userId))) {
    return forbidden();
  }

  const body = await readCollaboratorMutationRequest(request);
  const email = normalizeCollaboratorEmail(body.email);

  if (!email) {
    return Response.json({ error: "Valid email is required" }, { status: 400 });
  }

  await inviteProjectCollaborator({ projectId, email });

  const collaborators = await getProjectCollaboratorProfiles(projectId);

  return Response.json({ collaborators }, { status: 201 });
}

export async function DELETE(
  request: Request,
  context: CollaboratorsRouteContext,
) {
  const { projectId } = await context.params;
  const identity = await getCurrentClerkIdentity();

  if (!identity.userId) {
    return unauthorized();
  }

  if (!(await userOwnsProject(projectId, identity.userId))) {
    return forbidden();
  }

  const body = await readCollaboratorMutationRequest(request);
  const email = normalizeCollaboratorEmail(body.email);

  if (!email) {
    return Response.json({ error: "Valid email is required" }, { status: 400 });
  }

  await removeProjectCollaborator({ projectId, email });

  return Response.json({ success: true });
}
