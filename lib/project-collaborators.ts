import "server-only";

import { clerkClient } from "@clerk/nextjs/server";
import { User } from "@clerk/backend";

import { prisma } from "@/lib/prisma";

export interface ProjectCollaboratorProfile {
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeCollaboratorEmail(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const email = value.trim().toLowerCase();
  return EMAIL_PATTERN.test(email) ? email : null;
}

function getUserEmails(user: User) {
  return user.emailAddresses.map((email) => email.emailAddress.toLowerCase());
}

function getUserDisplayName(user: User) {
  return (
    user.fullName ||
    user.username ||
    user.primaryEmailAddress?.emailAddress ||
    null
  );
}

async function getClerkUsersByEmail(emails: string[]) {
  if (emails.length === 0) {
    return new Map<string, User>();
  }

  try {
    const client = await clerkClient();
    const CLERK_MAX_LIMIT = 100; // Adjust based on API docs
    const users = await client.users.getUserList({
      emailAddress: emails,
      limit: Math.min(emails.length, CLERK_MAX_LIMIT),
    });

    return users.data.reduce((usersByEmail, user) => {
      for (const email of getUserEmails(user)) {
        usersByEmail.set(email, user);
      }

      return usersByEmail;
    }, new Map<string, User>());
  } catch {
    return new Map<string, User>();
  }
}

export async function getProjectCollaboratorProfiles(
  projectId: string,
): Promise<ProjectCollaboratorProfile[]> {
  const collaborators = await prisma.projectCollaborator.findMany({
    where: { projectId },
    orderBy: { createdAt: "asc" },
    select: { email: true },
  });
  const emails = collaborators.map((collaborator) => collaborator.email);
  const usersByEmail = await getClerkUsersByEmail(emails);

  return emails.map((email) => {
    const user = usersByEmail.get(email);

    return {
      email,
      displayName: user ? getUserDisplayName(user) : null,
      avatarUrl: user?.imageUrl ?? null,
    };
  });
}

export async function inviteProjectCollaborator({
  projectId,
  email,
}: {
  projectId: string;
  email: string;
}) {
  await prisma.projectCollaborator.upsert({
    where: {
      projectId_email: {
        projectId,
        email,
      },
    },
    create: {
      projectId,
      email,
    },
    update: {},
  });
}

export async function removeProjectCollaborator({
  projectId,
  email,
}: {
  projectId: string;
  email: string;
}) {
  await prisma.projectCollaborator.deleteMany({
    where: {
      projectId,
      email,
    },
  });
}
