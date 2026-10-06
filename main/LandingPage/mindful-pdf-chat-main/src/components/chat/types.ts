export type Attachment = { name: string; size: number };

export type ChatMessage =
  | { id: string; role: "user"; content: string; attachment?: Attachment | undefined }
  | {
      id: string;
      role: "assistant";
      content: string;
      citations: number[];
      reasoning: string[];
      thinkingDuration: number;
      error?: string | undefined;
      streaming?: boolean | undefined;
    };

export type ChatSummary = { id: string; title: string; pinned?: boolean };

export type DocumentSummary = {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  createdAt: string | Date;
};

export const formatSize = (bytes: number) =>
  bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
