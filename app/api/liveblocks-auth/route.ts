import { currentUser } from "@clerk/nextjs/server";

import { getCurrentClerkIdentity, getProjectForUserAccess } from "@/lib/project-access";
import { getCursorColorForUser, getLiveblocksClient } from "@/lib/liveblocks";

interface LiveblocksAuthRequest {
  projectId?: unknown;
  room?: unknown;
  roomId?: unknown;
}

function unauthorized() {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}

function forbidden() {
  return Response.json({ error: "Forbidden" }, { status: 403 });
}

function badRequest(message: string) {
  return Response.json({ error: message }, { status: 400 });
}

async function readLiveblocksAuthRequest(request: Request) {
  try {
    return (await request.json()) as LiveblocksAuthRequest;
  } catch {
    return {};
  }
}

function getRequestedProjectId(body: LiveblocksAuthRequest) {
  const value = body.projectId ?? body.room ?? body.roomId;

  if (typeof value !== "string") {
    return null;
  }

  const projectId = value.trim();
  return projectId.length > 0 ? projectId : null;
}

export async function POST(request: Request) {
  const identity = await getCurrentClerkIdentity();

  if (!identity.userId) {
    return unauthorized();
  }

  const body = await readLiveblocksAuthRequest(request);
  const projectId = getRequestedProjectId(body);

  if (!projectId) {
    return badRequest("Project ID is required.");
  }

  const project = await getProjectForUserAccess({
    projectId,
    userId: identity.userId,
    primaryEmail: identity.primaryEmail,
  });

  if (!project) {
    return forbidden();
  }

  const user = await currentUser();
  const displayName =
    user?.fullName ||
    user?.username ||
    identity.primaryEmail ||
    "Ghost AI user";
  const avatarUrl = user?.imageUrl ?? "";
  const cursorColor = getCursorColorForUser(identity.userId);
  const liveblocks = getLiveblocksClient();

  await liveblocks.getOrCreateRoom(project.id, {
    defaultAccesses: [],
    metadata: {
      projectId: project.id,
      projectName: project.name,
    },
  });

  const session = liveblocks.prepareSession(identity.userId, {
    userInfo: {
      name: displayName,
      avatar: avatarUrl,
      color: cursorColor,
    },
  });

  session.allow(project.id, session.FULL_ACCESS);

  const { status, body: responseBody } = await session.authorize();

  return new Response(responseBody, {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}
