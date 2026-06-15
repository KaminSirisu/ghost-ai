import { get } from "@vercel/blob";

import { prisma } from "@/lib/prisma";
import {
  getCurrentClerkIdentity,
  getProjectForUserAccess,
} from "@/lib/project-access";

export const runtime = "nodejs";

interface SpecDownloadRouteContext {
  params: Promise<{
    projectId: string;
    specId: string;
  }>;
}

function unauthorized() {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}

function forbidden() {
  return Response.json({ error: "Forbidden" }, { status: 403 });
}

function notFound() {
  return Response.json({ error: "Spec not found" }, { status: 404 });
}

async function getAccessibleProject(projectId: string) {
  const identity = await getCurrentClerkIdentity();

  if (!identity.userId) {
    return {
      response: unauthorized(),
      project: null,
    };
  }

  const project = await getProjectForUserAccess({
    projectId,
    userId: identity.userId,
    primaryEmail: identity.primaryEmail,
  });

  if (!project) {
    return {
      response: forbidden(),
      project: null,
    };
  }

  return {
    response: null,
    project,
  };
}

function createSpecFilename(specId: string) {
  const safeSpecId = specId.replace(/[^a-zA-Z0-9_-]/g, "-");

  return `ghost-ai-spec-${safeSpecId}.md`;
}

export async function GET(_request: Request, context: SpecDownloadRouteContext) {
  const { projectId, specId } = await context.params;
  const { response } = await getAccessibleProject(projectId);

  if (response) {
    return response;
  }

  const spec = await prisma.projectSpec.findFirst({
    where: {
      id: specId,
      projectId,
    },
    select: {
      filePath: true,
    },
  });

  if (!spec) {
    return notFound();
  }

  const blobResult = await get(spec.filePath, {
    access: "private",
    useCache: false,
  });

  if (!blobResult || blobResult.statusCode !== 200) {
    return Response.json(
      { error: "Spec file could not be loaded" },
      { status: 502 },
    );
  }

  return new Response(blobResult.stream, {
    headers: {
      "Cache-Control": "private, no-store",
      "Content-Disposition": `attachment; filename="${createSpecFilename(specId)}"`,
      "Content-Type": "text/markdown; charset=utf-8",
    },
  });
}
