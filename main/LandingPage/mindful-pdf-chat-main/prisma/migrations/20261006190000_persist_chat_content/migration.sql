CREATE TABLE "ChatMessage" (
    "id" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "attachmentName" TEXT,
    "attachmentSize" INTEGER,
    "citations" JSONB NOT NULL,
    "reasoning" JSONB NOT NULL,
    "thinkingDuration" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ChatDocument" (
    "chatId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatDocument_pkey" PRIMARY KEY ("chatId","documentId")
);

CREATE INDEX "ChatMessage_chatId_createdAt_idx" ON "ChatMessage"("chatId", "createdAt");
CREATE INDEX "ChatDocument_documentId_idx" ON "ChatDocument"("documentId");

ALTER TABLE "ChatMessage"
ADD CONSTRAINT "ChatMessage_chatId_fkey"
FOREIGN KEY ("chatId") REFERENCES "Chat"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ChatDocument"
ADD CONSTRAINT "ChatDocument_chatId_fkey"
FOREIGN KEY ("chatId") REFERENCES "Chat"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ChatDocument"
ADD CONSTRAINT "ChatDocument_documentId_fkey"
FOREIGN KEY ("documentId") REFERENCES "Document"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
