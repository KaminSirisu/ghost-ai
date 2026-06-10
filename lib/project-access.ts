import "server-only";

import { auth, currentUser } from "@clerk/nextjs/server";
import type { Prisma } from "@/app/generated/prisma/client";

import { prisma } from "@/lib/prisma";

export interface ClerkIdentity {
  userId: string | null;
  primaryEmail: string | null;
}

export interface AccessibleProject {
  id: string;
  name: string;
  ownerId: string;
}

export async function getCurrentClerkIdentity(): Promise<ClerkIdentity> {
  const { userId } = await auth();

  if (!userId) {
    return {
      userId: null,
      primaryEmail: null,
    };
  }

  const user = await currentUser();

  return {
    userId,
    primaryEmail: user?.primaryEmailAddress?.emailAddress ?? null,
  };
}

export async function getProjectForUserAccess({
  projectId,
  userId,
  primaryEmail,
}: {
  projectId: string;
  userId: string;
  primaryEmail: string | null;
}): Promise<AccessibleProject | null> {
  const normalizedEmail = primaryEmail?.trim().toLowerCase() ?? null;
  const accessConditions: Prisma.ProjectWhereInput[] = [
    {
      ownerId: userId,
    },
  ];

  if (normalizedEmail) {
    accessConditions.push({
      collaborators: {
        some: {
          email: normalizedEmail,
        },
      },
    });
  }

  return prisma.project.findFirst({
    where: {
      id: projectId,
      OR: accessConditions,
    },
    select: {
      id: true,
      name: true,
      ownerId: true,
    },
  });
}

export async function userOwnsProject(projectId: string, ownerId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { ownerId: true },
  });

  return project?.ownerId === ownerId;
}
