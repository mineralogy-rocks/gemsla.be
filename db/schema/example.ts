import { pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";

// Example table - you can use this as a template for your own tables
export const posts = pgTable("posts", {
	id: serial("id").primaryKey(),
	title: varchar("title", { length: 255 }).notNull(),
	content: text("content"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Type exports for use in application
export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;
