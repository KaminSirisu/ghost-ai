import { auth as triggerAuth } from "@trigger.dev/sdk";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { getCurrentClerkIdentity } from "@/lib/project-access";

export const runtime = "nodejs";

const specTokenRequestSchema = z.object({
  runId: z.string().trim().min(1),
});

async function readTokenRequest(request: Request) {
  try {
    const body = (await request.json()) as unknown;
    return specTokenRequestSchema.safeParse(body);
  } catch {
    return specTokenRequestSchema.safeParse(null);
  }
}

export async function POST(request: Request) {
  const body = await readTokenRequest(request);

  if (!body.success) {
    return Response.json({ error: "Run ID is required" }, { status: 400 });
  }

  const identity = await getCurrentClerkIdentity();

  if (!identity.userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const taskRun = await prisma.taskRun.findFirst({
    where: {
      runId: body.data.runId,
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
        tasks: ["generate-spec"],
      },
    },
    expirationTime: "1h",
  });

  return Response.json({ token });
}
