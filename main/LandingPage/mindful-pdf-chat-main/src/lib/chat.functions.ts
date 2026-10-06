import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { getDb } from "./db.server";

const titleSchema = z.string().trim().min(1, "Chat name cannot be empty.").max(120, "Chat name is too long.");
const idSchema = z.object({ id: z.string().min(1) });

export const listChats = createServerFn({ method: "GET" }).handler(async () => {
  return getDb().chat.findMany({
    select: { id: true, title: true, pinned: true },
    orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
  });
});

export const createChat = createServerFn({ method: "POST" })
  .inputValidator(z.object({ title: titleSchema }))
  .handler(async ({ data }) => {
    return getDb().chat.create({
      data: { title: data.title },
      select: { id: true, title: true, pinned: true },
    });
  });

export const renameChat = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string().min(1), title: titleSchema }))
  .handler(async ({ data }) => {
    return getDb().chat.update({
      where: { id: data.id },
      data: { title: data.title },
      select: { id: true, title: true, pinned: true },
    });
  });

export const toggleChatPin = createServerFn({ method: "POST" })
  .inputValidator(idSchema)
  .handler(async ({ data }) => {
    const db = getDb();
    const chat = await db.chat.findUnique({
      where: { id: data.id },
      select: { pinned: true },
    });

    if (!chat) throw new Error("Chat not found.");

    return db.chat.update({
      where: { id: data.id },
      data: { pinned: !chat.pinned },
      select: { id: true, title: true, pinned: true },
    });
  });

export const deleteChat = createServerFn({ method: "POST" })
  .inputValidator(idSchema)
  .handler(async ({ data }) => {
    await getDb().chat.delete({ where: { id: data.id } });
    return { success: true };
  });
