import { prisma } from "@/lib/prisma";
import {
  getCurrentClerkIdentity,
  getProjectForUserAccess,
} from "@/lib/project-access";

export const runtime = "nodejs";

interface ProjectSpecsRouteContext {
  params: Promise<{
    projectId: string;
  }>;
}

function createSpecFilename(specId: string) {
  const safeSpecId = specId.replace(/[^a-zA-Z0-9_-]/g, "-");

  return `ghost-ai-spec-${safeSpecId}.md`;
}

export async function GET(_request: Request, context: ProjectSpecsRouteContext) {
  const { projectId } = await context.params;
  const identity = await getCurrentClerkIdentity();

  if (!identity.userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const project = await getProjectForUserAccess({
    projectId,
    userId: identity.userId,
    primaryEmail: identity.primaryEmail,
  });

  if (!project) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const specs = await prisma.projectSpec.findMany({
    where: {
      projectId: project.id,
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      createdAt: true,
    },
  });

  return Response.json({
    specs: specs.map((spec) => ({
      id: spec.id,
      createdAt: spec.createdAt.toISOString(),
      filename: createSpecFilename(spec.id),
    })),
  });
}
