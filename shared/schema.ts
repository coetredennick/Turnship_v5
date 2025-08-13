import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  name: text("name"),
  created_at: timestamp("created_at").defaultNow(),
});

export const profiles = pgTable("profiles", {
  user_id: varchar("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  school: text("school"),
  grad_year: integer("grad_year"),
  major: text("major"),
  interests: text("interests").array(),
  targets: text("targets").array(),
  location: text("location"),
  tone: text("tone").default("Warm"),
});

export const connections = pgTable("connections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  user_id: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  email: text("email"),
  full_name: text("full_name").notNull(),
  company: text("company"),
  role: text("role"),
  location: text("location"),
  tags: text("tags").array(),
  notes: text("notes"),
  unique_tidbits: text("unique_tidbits"), // User-inputted unique details about this connection
  source: text("source"),
  alumni: boolean("alumni").default(false),
  school: text("school"),
  grad_year: integer("grad_year"),
  stage: text("stage").default("First Outreach"),
  last_contacted_at: timestamp("last_contacted_at"),
  created_at: timestamp("created_at").defaultNow(),
  // Legacy/compatibility fields expected by some client code
  stage_status: text("stage_status").default("ready"),
  current_draft_id: varchar("current_draft_id"),
  last_reply_at: timestamp("last_reply_at"),
  reply_sentiment: text("reply_sentiment"),
});

export const emails_sent = pgTable("emails_sent", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  user_id: varchar("user_id").references(() => users.id).notNull(),
  connection_id: varchar("connection_id").references(() => connections.id).notNull(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  sent_at: timestamp("sent_at").defaultNow(),
});

export const alumni = pgTable("alumni", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  full_name: text("full_name").notNull(),
  email: text("email"),
  company: text("company"),
  role: text("role"),
  school: text("school"),
  program: text("program"),
  grad_year: integer("grad_year"),
  location: text("location"),
  source: text("source"),
  notes: text("notes"),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  created_at: true,
});

export const insertProfileSchema = createInsertSchema(profiles);

export const insertConnectionSchema = createInsertSchema(connections).omit({
  id: true,
  created_at: true,
});

export const insertEmailSchema = createInsertSchema(emails_sent).omit({
  id: true,
  sent_at: true,
});

export const insertAlumniSchema = createInsertSchema(alumni).omit({
  id: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertProfile = z.infer<typeof insertProfileSchema>;
export type Profile = typeof profiles.$inferSelect;

export type InsertConnection = z.infer<typeof insertConnectionSchema>;
// Note: Do not import this Connection type in runtime code. Use API DTOs instead.
export type Connection = typeof connections.$inferSelect;

export type InsertEmail = z.infer<typeof insertEmailSchema>;
export type Email = typeof emails_sent.$inferSelect;

export type InsertAlumni = z.infer<typeof insertAlumniSchema>;
export type Alumni = typeof alumni.$inferSelect;
