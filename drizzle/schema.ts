import { pgTable, index, foreignKey, uuid, text, jsonb, timestamp, boolean, unique, integer, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const dictionaryEditorStatus = pgEnum("dictionary_editor_status", ['PENDING', 'ACCEPTED'])
export const flashcardStatus = pgEnum("flashcard_status", ['NEW', 'LEARNING', 'REVIEW', 'MASTERED'])
export const subscriptionStatus = pgEnum("subscription_status", ['TRIAL', 'ACTIVE', 'CANCELLED', 'EXPIRED'])
export const userRole = pgEnum("user_role", ['USER', 'ADMIN'])
export const userTier = pgEnum("user_tier", ['FREE', 'PREMIUM'])


export const activityLogs = pgTable("activity_logs", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	type: text().notNull(),
	metadata: jsonb(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("activity_logs_user_created_idx").using("btree", table.userId.asc().nullsLast().op("timestamptz_ops"), table.createdAt.asc().nullsLast().op("timestamptz_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "activity_logs_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const examplePhrases = pgTable("example_phrases", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	phrase: text().notNull(),
	translation: text().notNull(),
	wordId: uuid("word_id").notNull(),
	isAiGenerated: boolean("is_ai_generated").default(false).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("example_phrases_word_id_idx").using("btree", table.wordId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.wordId],
			foreignColumns: [words.id],
			name: "example_phrases_word_id_words_id_fk"
		}).onDelete("cascade"),
]);

export const flashcardProgress = pgTable("flashcard_progress", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	wordId: uuid("word_id").notNull(),
	status: flashcardStatus().default('NEW').notNull(),
	leitnerBox: integer("leitner_box").default(1).notNull(),
	nextReviewAt: timestamp("next_review_at", { withTimezone: true, mode: 'string' }),
	lastReviewAt: timestamp("last_review_at", { withTimezone: true, mode: 'string' }),
	reviewCount: integer("review_count").default(0).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("flashcard_progress_user_id_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "flashcard_progress_user_id_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.wordId],
			foreignColumns: [words.id],
			name: "flashcard_progress_word_id_words_id_fk"
		}).onDelete("cascade"),
	unique("flashcard_progress_user_word_unique").on(table.userId, table.wordId),
]);

export const forks = pgTable("forks", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	sourceDictionaryId: uuid("source_dictionary_id").notNull(),
	forkedById: uuid("forked_by_id").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.sourceDictionaryId],
			foreignColumns: [dictionaries.id],
			name: "forks_source_dictionary_id_dictionaries_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.forkedById],
			foreignColumns: [users.id],
			name: "forks_forked_by_id_users_id_fk"
		}).onDelete("cascade"),
	unique("forks_source_user_unique").on(table.sourceDictionaryId, table.forkedById),
]);

export const quizHistory = pgTable("quiz_history", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	dictionaryId: uuid("dictionary_id").notNull(),
	score: integer().notNull(),
	totalQuestions: integer("total_questions").notNull(),
	percentage: integer().notNull(),
	questionTypes: jsonb("question_types"),
	duration: integer(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("quiz_history_user_id_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "quiz_history_user_id_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.dictionaryId],
			foreignColumns: [dictionaries.id],
			name: "quiz_history_dictionary_id_dictionaries_id_fk"
		}).onDelete("cascade"),
]);

export const subscriptions = pgTable("subscriptions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	iyzicoSubId: text("iyzico_sub_id"),
	status: subscriptionStatus().default('TRIAL').notNull(),
	trialEndsAt: timestamp("trial_ends_at", { withTimezone: true, mode: 'string' }),
	currentPeriodEnd: timestamp("current_period_end", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "subscriptions_user_id_users_id_fk"
		}).onDelete("cascade"),
	unique("subscriptions_user_id_unique").on(table.userId),
]);

export const users = pgTable("users", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	supabaseId: text("supabase_id").notNull(),
	email: text().notNull(),
	username: text().notNull(),
	locale: text().default('en').notNull(),
	tier: userTier().default('FREE').notNull(),
	aiCredits: integer("ai_credits").default(30).notNull(),
	creditsResetAt: timestamp("credits_reset_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	totalWords: integer("total_words").default(0).notNull(),
	totalFlashcards: integer("total_flashcards").default(0).notNull(),
	totalQuizzes: integer("total_quizzes").default(0).notNull(),
	streakCount: integer("streak_count").default(0).notNull(),
	lastActiveDate: timestamp("last_active_date", { withTimezone: true, mode: 'string' }),
	hasCompletedTour: boolean("has_completed_tour").default(false).notNull(),
	isDeleted: boolean("is_deleted").default(false).notNull(),
	emailOptOut: boolean("email_opt_out").default(false).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	role: userRole().default('USER').notNull(),
	lastReminderSentAt: timestamp("last_reminder_sent_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	unique("users_supabase_id_unique").on(table.supabaseId),
	unique("users_email_unique").on(table.email),
	unique("users_username_unique").on(table.username),
]);

export const words = pgTable("words", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	title: text().notNull(),
	translation: text().notNull(),
	order: integer().default(0).notNull(),
	dictionaryId: uuid("dictionary_id").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	lastModifiedById: uuid("last_modified_by_id"),
}, (table) => [
	index("words_dictionary_id_idx").using("btree", table.dictionaryId.asc().nullsLast().op("uuid_ops")),
	index("words_last_modified_by_id_idx").using("btree", table.lastModifiedById.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.dictionaryId],
			foreignColumns: [dictionaries.id],
			name: "words_dictionary_id_dictionaries_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.lastModifiedById],
			foreignColumns: [users.id],
			name: "words_last_modified_by_id_users_id_fk"
		}).onDelete("set null"),
]);

export const dictionaryEditors = pgTable("dictionary_editors", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	dictionaryId: uuid("dictionary_id").notNull(),
	userId: uuid("user_id").notNull(),
	status: dictionaryEditorStatus().default('PENDING').notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	inviteToken: text("invite_token"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("dictionary_editors_token_idx").using("btree", table.inviteToken.asc().nullsLast().op("text_ops")),
	index("dictionary_editors_user_id_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.dictionaryId],
			foreignColumns: [dictionaries.id],
			name: "dictionary_editors_dictionary_id_dictionaries_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "dictionary_editors_user_id_users_id_fk"
		}).onDelete("cascade"),
	unique("dictionary_editors_unique").on(table.dictionaryId, table.userId),
]);

export const dictionaries = pgTable("dictionaries", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	title: text().notNull(),
	description: text(),
	language: text().notNull(),
	isPublic: boolean("is_public").default(false).notNull(),
	userId: uuid("user_id").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	activeMagicWords: jsonb("active_magic_words"),
	lastDailyUpdateSentAt: timestamp("last_daily_update_sent_at", { withTimezone: true, mode: 'string' }),
	slug: text(),
	seoTitle: text("seo_title"),
	seoDescription: text("seo_description"),
	seoGeneratedAt: timestamp("seo_generated_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("dictionaries_is_public_idx").using("btree", table.isPublic.asc().nullsLast().op("bool_ops")),
	index("dictionaries_slug_idx").using("btree", table.slug.asc().nullsLast().op("text_ops")),
	index("dictionaries_user_id_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "dictionaries_user_id_users_id_fk"
		}).onDelete("cascade"),
	unique("dictionaries_slug_unique").on(table.slug),
]);

export const coupons = pgTable("coupons", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	code: text().notNull(),
	maxUses: integer("max_uses").default(1).notNull(),
	usedCount: integer("used_count").default(0).notNull(),
	expiresAt: timestamp("expires_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("coupons_code_unique").on(table.code),
]);

export const couponRedemptions = pgTable("coupon_redemptions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	couponId: uuid("coupon_id").notNull(),
	userId: uuid("user_id").notNull(),
	redeemedAt: timestamp("redeemed_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("coupon_redemptions_user_id_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.couponId],
			foreignColumns: [coupons.id],
			name: "coupon_redemptions_coupon_id_coupons_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "coupon_redemptions_user_id_users_id_fk"
		}).onDelete("cascade"),
	unique("coupon_redemptions_user_coupon_unique").on(table.couponId, table.userId),
]);
