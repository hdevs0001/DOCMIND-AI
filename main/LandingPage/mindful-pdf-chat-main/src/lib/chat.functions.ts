import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { getDb } from "./db.server";

const titleSchema = z.string().trim().min(1, "Chat name cannot be empty.").max(120, "Chat name is too long.");
const idSchema = z.object({ id: z.string().min(1) });

const attachmentSchema = z
  .object({
    name: z.string().min(1),
    size: z.number().int().nonnegative(),
  })
  .optional();

const messageSchema = z.object({
  chatId: z.string().min(1),
  role: z.enum(["user", "assistant"]),
  content: z.string(),
  attachment: attachmentSchema,
  citations: z.array(z.number().int()).default([]),
  reasoning: z.array(z.string()).default([]),
  thinkingDuration: z.number().nonnegative().default(0),
});

const documentIdSchema = z.object({
  chatId: z.string().min(1),
  documentId: z.string().min(1),
});

export const listChats = createServerFn({ method: "GET" }).handler(async () => {
  return getDb().chat.findMany({
    select: { id: true, title: true, pinned: true },
    orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
  });
});

export const getChat = createServerFn({ method: "GET" })
  .inputValidator(idSchema)
  .handler(async ({ data }) => {
    const chat = await getDb().chat.findUnique({
      where: { id: data.id },
      select: {
        id: true,
        title: true,
        pinned: true,
        messages: {
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            role: true,
            content: true,
            attachmentName: true,
            attachmentSize: true,
            citations: true,
            reasoning: true,
            thinkingDuration: true,
          },
        },
        documents: {
          orderBy: { createdAt: "desc" },
          select: {
            document: {
              select: {
                id: true,
                name: true,
                mimeType: true,
                size: true,
                createdAt: true,
              },
            },
          },
        },
      },
    });

    if (!chat) throw new Error("Chat not found.");

    return {
      id: chat.id,
      title: chat.title,
      pinned: chat.pinned,
      messages: chat.messages.map((message) => ({
        id: message.id,
        role: message.role as "user" | "assistant",
        content: message.content,
        attachment:
          message.attachmentName && message.attachmentSize != null
            ? { name: message.attachmentName, size: message.attachmentSize }
            : undefined,
        citations: Array.isArray(message.citations) ? (message.citations as number[]) : [],
        reasoning: Array.isArray(message.reasoning) ? (message.reasoning as string[]) : [],
        thinkingDuration: message.thinkingDuration,
      })),
      documents: chat.documents.map(({ document }) => document),
    };
  });

export const createChat = createServerFn({ method: "POST" })
  .inputValidator(z.object({ title: titleSchema, documentId: z.string().min(1).optional() }))
  .handler(async ({ data }) => {
    return getDb().chat.create({
      data: {
        title: data.title,
        ...(data.documentId ? { documents: { create: { documentId: data.documentId } } } : {}),
      },
      select: { id: true, title: true, pinned: true },
    });
  });

export const saveChatMessage = createServerFn({ method: "POST" })
  .inputValidator(messageSchema)
  .handler(async ({ data }) => {
    const message = await getDb().chatMessage.create({
      data: {
        chatId: data.chatId,
        role: data.role,
        content: data.content,
        attachmentName: data.attachment?.name,
        attachmentSize: data.attachment?.size,
        citations: data.citations,
        reasoning: data.reasoning,
        thinkingDuration: data.thinkingDuration,
      },
      select: {
        id: true,
        role: true,
        content: true,
        attachmentName: true,
        attachmentSize: true,
        citations: true,
        reasoning: true,
        thinkingDuration: true,
      },
    });

    return {
      id: message.id,
      role: message.role as "user" | "assistant",
      content: message.content,
      attachment:
        message.attachmentName && message.attachmentSize != null
          ? { name: message.attachmentName, size: message.attachmentSize }
          : undefined,
      citations: Array.isArray(message.citations) ? (message.citations as number[]) : [],
      reasoning: Array.isArray(message.reasoning) ? (message.reasoning as string[]) : [],
      thinkingDuration: message.thinkingDuration,
    };
  });

export const attachDocumentToChat = createServerFn({ method: "POST" })
  .inputValidator(documentIdSchema)
  .handler(async ({ data }) => {
    await getDb().chatDocument.upsert({
      where: {
        chatId_documentId: {
          chatId: data.chatId,
          documentId: data.documentId,
        },
      },
      create: { chatId: data.chatId, documentId: data.documentId },
      update: {},
    });

    return { success: true };
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
