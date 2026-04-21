import { pgTable, serial, text, integer, timestamp, index } from "drizzle-orm/pg-core";

export const searchLogsTable = pgTable(
  "search_logs",
  {
    id: serial("id").primaryKey(),
    query: text("query").notNull(),
    resultsCount: integer("results_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("search_logs_query_idx").on(t.query),
    index("search_logs_created_at_idx").on(t.createdAt),
  ],
);

export type SearchLog = typeof searchLogsTable.$inferSelect;
export type InsertSearchLog = typeof searchLogsTable.$inferInsert;
