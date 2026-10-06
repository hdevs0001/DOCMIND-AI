import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { getDb } from "./db.server";

const chatTitleSchema = z.object({
  title: z.string().trim().min(1, "Chat name cannot be empty.").max(120, "Chat name is too long."),
});

const chatIdSchema = z.object({
  id: z.string().min(1),
});

export const listChats = createServerFn({ method: "GET" }).handler(async () => {
  return getDb().chat.findMany({
    select: {
      id: true,
      title: true,
      pinned: true,
    },
    orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
  });
});

export const createChat = createServerFn({ method: "POST" })
  .validator(chatTitleSchema)
  .handler(async ({ data }) => {
    return getDb().chat.create({
      data: {
        title: data.title,
      },
      select: {
        id: true,
        title: true,
        pinned: true,
      },
    });
  });

export const renameChat = createServerFn({ method: "POST" })
  .validator(
    z.object({
      id: z.string().min(1),
      title: chatTitleSchema.shape.title,
    }),
  )
  .handler(async ({ data }) => {
    const updated = await getDb().chat.update({
      where: { id: data.id },
      data: { title: data.title },
      select: {
        id: true,
        title: true,
        pinned: true,
      },
    });

    return updated;
  });

export const toggleChatPin = createServerFn({ method: "POST" })
  .validator(chatIdSchema)
  .handler(async ({ data }) => {
    const chat = await getDb().chat.findUnique({
      where: { id: data.id },
      select: { pinned: true },
    });

    if (!chat) {
      throw new Error("Chat not found.");
    }

    return getDb().chat.update({
      where: { id: data.id },
      data: { pinned: !chat.pinned },
      select: {
        id: true,
        title: true,
        pinned: true,
      },
    });
  });

export const deleteChat = createServerFn({ method: "POST" })
  .validator(chatIdSchema)
  .handler(async ({ data }) => {
    await getDb().chat.delete({
      where: { id: data.id },
    });

    return { success: true };
  });
