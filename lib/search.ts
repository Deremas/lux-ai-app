import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { generateEmbedding } from "./embeddings";

export async function searchDocuments(
  query: string,
  limit: number = 5,
  threshold: number = 0.5
) {
  const embedding = await generateEmbedding(query);

  const embeddingLiteral = `[${embedding.join(",")}]`;
  const rows = await prisma.$queryRaw<
    Array<{ id: string; content: string; similarity: number }>
  >(Prisma.sql`
    SELECT
      id,
      content,
      1 - (embedding <=> ${embeddingLiteral}::vector) AS similarity
    FROM documents
    WHERE 1 - (embedding <=> ${embeddingLiteral}::vector) > ${threshold}
    ORDER BY similarity DESC
    LIMIT ${limit}
  `);

  return rows;
}
