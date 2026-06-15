import { auth as triggerAuth } from "@trigger.dev/sdk";

import { prisma } from "@/lib/prisma";
import { getCurrentClerkIdentity } from "@/lib/project-access";

export const runtime = "nodejs";

interface DesignTokenRequestBody {
  runId?: unknown;
}

function getRequiredString(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

async function readTokenRequest(request: Request) {
  try {
    const body = (await request.json()) as unknown;

    if (!body || typeof body !== "object") {
      return {
        runId: null,
      };
    }

    const requestBody = body as DesignTokenRequestBody;

    return {
      runId: getRequiredString(requestBody.runId),
    };
  } catch {
    return {
      runId: null,
    };
  }
}

export async function POST(request: Request) {
  const body = await readTokenRequest(request);

  if (!body.runId) {
    return Response.json({ error: "Run ID is required" }, { status: 400 });
  }

  const identity = await getCurrentClerkIdentity();

  if (!identity.userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const taskRun = await prisma.taskRun.findFirst({
    where: {
      runId: body.runId,
      userId: identity.userId,
    },
    select: {
      runId: true,
    },
  });

  if (!taskRun) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const token = await triggerAuth.createPublicToken({
    scopes: {
      read: {
        runs: [taskRun.runId],
        tasks: ["design-agent"],
      },
    },
    expirationTime: "1h",
  });

  return Response.json({ token });
}
