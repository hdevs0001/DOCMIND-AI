import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { runRetrievalTest } from "@/lib/rag/retrieval-test.server";
import { runAnswerTest } from "@/lib/rag/answer-test.server";

export const Route = createFileRoute("/rag-test")({
  component: RagTestPage,
});

const DOCUMENT_ID = "cmuzlnpvt0000psszzty4oyyv";

function RagTestPage() {
  const [question, setQuestion] = useState("What technologies does the candidate know?");

  const [results, setResults] = useState<
    Array<{
      id: string;
      documentId: string;
      content: string;
      metadata: Record<string, unknown>;
      similarity: number;
    }>
  >([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [answer, setAnswer] = useState("");
  const [citations, setCitations] = useState<number[]>([]);
  const testAnswer = async () => {
    setLoading(true);
    setError(null);
    setAnswer("");
    setCitations([]);

    try {
      const result = await runAnswerTest({
        data: {
          documentId: DOCUMENT_ID,
          question,
        },
      });

      setAnswer(result.answer);
      setCitations(result.citations);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Answer generation failed.");
    } finally {
      setLoading(false);
    }
  };
  const testRetrieval = async () => {
    setLoading(true);
    setError(null);
    setResults([]);

    try {
      const retrieved = await runRetrievalTest({
        data: {
          documentId: DOCUMENT_ID,
          question,
        },
      });

      setResults(retrieved);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Retrieval failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-2 text-2xl font-semibold">RAG Retrieval Test</h1>

        <p className="mb-6 text-sm text-muted-foreground">
          Testing pgvector retrieval against resume1 (4).pdf
        </p>

        <div className="space-y-4">
          <textarea
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            className="min-h-28 w-full rounded-xl border bg-background p-4"
            placeholder="Ask a question..."
          />

          <button
            onClick={() => void testRetrieval()}
            disabled={loading || !question.trim()}
            className="rounded-xl bg-primary px-5 py-2.5 text-primary-foreground disabled:opacity-50"
          >
            {loading ? "Searching..." : "Test Retrieval"}
          </button>

          {error && (
            <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {results.map((result, index) => (
              <article key={result.id} className="rounded-xl border p-5">
                <div className="mb-3 flex items-center justify-between">
                  <strong>Result {index + 1}</strong>

                  <span className="text-sm text-muted-foreground">
                    Similarity: {result.similarity.toFixed(4)}
                  </span>
                </div>

                <p className="mb-3 whitespace-pre-wrap text-sm leading-6">{result.content}</p>

                <pre className="overflow-x-auto rounded-lg bg-muted p-3 text-xs">
                  {JSON.stringify(result.metadata, null, 2)}
                </pre>
              </article>
            ))}
          </div>
        </div>
      </div>
      <button
        onClick={() => void testAnswer()}
        disabled={loading || !question.trim()}
        className="rounded-xl bg-primary px-5 py-2.5 text-primary-foreground disabled:opacity-50"
      >
        {loading ? "Thinking..." : "Ask Document"}
      </button>
      {answer && (
        <div className="rounded-xl border p-5">
          <h2 className="mb-3 text-lg font-semibold">Answer</h2>

          <p className="whitespace-pre-wrap text-sm leading-7">{answer}</p>

          {citations.length > 0 && (
            <p className="mt-4 text-xs text-muted-foreground">Pages: {citations.join(", ")}</p>
          )}
        </div>
      )}
    </main>
  );
}
