/**
 * ============================================================
 *  MOCK — replace with your FastAPI endpoint (POST /ask)
 * ============================================================
 *  Example real implementation:
 *
 *  const form = new FormData();
 *  form.append("question", question);
 *  if (file) form.append("file", file);
 *  const res = await fetch(`${API_URL}/ask`, { method: "POST", body: form, signal });
 *  if (!res.ok) throw new Error("Couldn't read this PDF");
 *  return (await res.json()) as AskResult;
 */
export type AskResult = {
  answer: string;
  citations: number[];
  reasoning: string[];
};

export async function askDocument(
  question: string,
  file: File | null,
  signal?: AbortSignal,
): Promise<AskResult> {
  const delay = 2000 + Math.random() * 2000;
  await new Promise<void>((resolve, reject) => {
    const t = setTimeout(resolve, delay);
    signal?.addEventListener("abort", () => {
      clearTimeout(t);
      reject(new DOMException("Aborted", "AbortError"));
    });
  });

  if (file && file.size === 0) throw new Error("Couldn't read this PDF");

  const pages = [4, 5, 11, 12].sort(() => Math.random() - 0.5).slice(0, 2).sort((a, b) => a - b);
  const docName = file?.name ?? "your document";

  return {
    answer: `Here's what I found in **${docName}** about _"${question}"_:\n\n- **Main idea:** The document frames the topic around a clear objective and supporting evidence (see page ${pages[0]}).\n- **Key detail:** Specific figures and dates are listed in the second section, which narrows the scope considerably.\n- **Conclusion:** The author recommends a phased approach, summarised on page ${pages[1]}.\n\nLet me know if you want me to go deeper into any of these points.`,
    citations: pages,
    reasoning: [
      "Parsed the question and extracted key terms",
      "Searched 3 sections of the document",
      `Found relevant passages on pages ${pages.join(" and ")}`,
      "Cross-checked the passages for consistency",
    ],
  };
}
