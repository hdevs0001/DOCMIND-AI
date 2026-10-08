import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { answerQuestion } from "./answer.server";

export const runAnswerTest = createServerFn({
  method: "POST",
})
  .inputValidator(
    z.object({
      documentId: z.string().min(1),
      question: z.string().trim().min(1),
    }),
  )
  .handler(async ({ data }) => {
    return answerQuestion(
      data.documentId,
      data.question,
    );
  });