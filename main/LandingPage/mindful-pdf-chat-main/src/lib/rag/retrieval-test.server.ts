import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { retrieveRelevantChunks } from "./retrieval.server";

export const runRetrievalTest = createServerFn({
  method: "POST",
})
  .inputValidator(
    z.object({
      documentId: z.string().min(1),
      question: z.string().trim().min(1),
    }),
  )
  .handler(async ({ data }) => {
    return retrieveRelevantChunks(
      data.documentId,
      data.question,
      5,
    );
  });