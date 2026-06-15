import { auth as triggerAuth, tasks } from "@trigger.dev/sdk";

import { prisma } from "@/lib/prisma";
import {
  getCurrentClerkIdentity,
  getProjectForUserAccess,
} from "@/lib/project-access";
import type { designAgent } from "@/trigger/design-agent";

export const runtime = "nodejs";

interface DesignRequestBody {
  prompt?: unknown;
  projectId?: unknown;
  roomId?: unknown;
}

function unauthorized() {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}

function forbidden() {
  return Response.json({ error: "Forbidden" }, { status: 403 });
}

function getRequiredString(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

async function readDesignRequest(request: Request) {
  try {
    const body = (await request.json()) as unknown;

    if (!body || typeof body !== "object") {
      return {
        prompt: null,
        projectId: null,
        roomId: null,
      };
    }

    const requestBody = body as DesignRequestBody;

    return {
      prompt: getRequiredString(requestBody.prompt),
      projectId: getRequiredString(requestBody.projectId),
      roomId: getRequiredString(requestBody.roomId),
    };
  } catch {
    return {
      prompt: null,
      projectId: null,
      roomId: null,
    };
  }
}

export async function POST(request: Request) {
  const body = await readDesignRequest(request);

  if (!body.prompt || !body.projectId || !body.roomId) {
    return Response.json(
      { error: "Prompt, projectId, and roomId are required" },
      { status: 400 },
    );
  }

  const identity = await getCurrentClerkIdentity();

  if (!identity.userId) {
    return unauthorized();
  }

  const project = await getProjectForUserAccess({
    projectId: body.projectId,
    userId: identity.userId,
    primaryEmail: identity.primaryEmail,
  });

  if (!project) {
    return forbidden();
  }

  const handle = await tasks.trigger<typeof designAgent>("design-agent", {
    prompt: body.prompt,
    roomId: body.roomId,
  });

  await prisma.taskRun.create({
    data: {
      runId: handle.id,
      projectId: project.id,
      userId: identity.userId,
    },
  });

  const publicToken = await triggerAuth.createPublicToken({
    scopes: {
      read: {
        runs: [handle.id],
        tasks: ["design-agent"],
      },
    },
    expirationTime: "1h",
  });

  return Response.json({ runId: handle.id, publicToken }, { status: 201 });
}
