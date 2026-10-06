import { createServerFn } from "@tanstack/react-start";

import { getDb } from "./db.server";

const MAX_PDF_SIZE = 25 * 1024 * 1024;

export type StoredDocument = {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  createdAt: Date;
};

const isPdfFile = (file: File) =>
  file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

export const listDocuments = createServerFn({ method: "GET" }).handler(async () => {
  return getDb().document.findMany({
    select: {
      id: true,
      name: true,
      mimeType: true,
      size: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
});

export const uploadDocument = createServerFn({ method: "POST" })
  .inputValidator((data: FormData) => {
    if (!(data instanceof FormData)) {
      throw new Error("Expected a FormData payload.");
    }

    return data;
  })
  .handler(async ({ data }): Promise<StoredDocument> => {
    const file = data.get("file");

    if (!(file instanceof File)) {
      throw new Error("No PDF file was provided.");
    }

    if (!isPdfFile(file)) throw new Error("Only PDF files are supported.");
    if (file.size === 0) throw new Error("The PDF is empty.");
    if (file.size > MAX_PDF_SIZE) throw new Error("PDFs must be 25 MB or smaller.");

    const bytes = new Uint8Array(await file.arrayBuffer());

    return getDb().document.create({
      data: {
        name: file.name.trim() || "document.pdf",
        mimeType: "application/pdf",
        size: file.size,
        data: bytes,
      },
      select: {
        id: true,
        name: true,
        mimeType: true,
        size: true,
        createdAt: true,
      },
    });
  });
