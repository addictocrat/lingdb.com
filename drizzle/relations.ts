import { relations } from "drizzle-orm/relations";
import { users, activityLogs, words, examplePhrases, flashcardProgress, dictionaries, forks, quizHistory, subscriptions, dictionaryEditors, coupons, couponRedemptions } from "./schema";

export const activityLogsRelations = relations(activityLogs, ({one}) => ({
	user: one(users, {
		fields: [activityLogs.userId],
		references: [users.id]
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	activityLogs: many(activityLogs),
	flashcardProgresses: many(flashcardProgress),
	forks: many(forks),
	quizHistories: many(quizHistory),
	subscriptions: many(subscriptions),
	words: many(words),
	dictionaryEditors: many(dictionaryEditors),
	dictionaries: many(dictionaries),
	couponRedemptions: many(couponRedemptions),
}));

export const examplePhrasesRelations = relations(examplePhrases, ({one}) => ({
	word: one(words, {
		fields: [examplePhrases.wordId],
		references: [words.id]
	}),
}));

export const wordsRelations = relations(words, ({one, many}) => ({
	examplePhrases: many(examplePhrases),
	flashcardProgresses: many(flashcardProgress),
	dictionary: one(dictionaries, {
		fields: [words.dictionaryId],
		references: [dictionaries.id]
	}),
	user: one(users, {
		fields: [words.lastModifiedById],
		references: [users.id]
	}),
}));

export const flashcardProgressRelations = relations(flashcardProgress, ({one}) => ({
	user: one(users, {
		fields: [flashcardProgress.userId],
		references: [users.id]
	}),
	word: one(words, {
		fields: [flashcardProgress.wordId],
		references: [words.id]
	}),
}));

export const forksRelations = relations(forks, ({one}) => ({
	dictionary: one(dictionaries, {
		fields: [forks.sourceDictionaryId],
		references: [dictionaries.id]
	}),
	user: one(users, {
		fields: [forks.forkedById],
		references: [users.id]
	}),
}));

export const dictionariesRelations = relations(dictionaries, ({one, many}) => ({
	forks: many(forks),
	quizHistories: many(quizHistory),
	words: many(words),
	dictionaryEditors: many(dictionaryEditors),
	user: one(users, {
		fields: [dictionaries.userId],
		references: [users.id]
	}),
}));

export const quizHistoryRelations = relations(quizHistory, ({one}) => ({
	user: one(users, {
		fields: [quizHistory.userId],
		references: [users.id]
	}),
	dictionary: one(dictionaries, {
		fields: [quizHistory.dictionaryId],
		references: [dictionaries.id]
	}),
}));

export const subscriptionsRelations = relations(subscriptions, ({one}) => ({
	user: one(users, {
		fields: [subscriptions.userId],
		references: [users.id]
	}),
}));

export const dictionaryEditorsRelations = relations(dictionaryEditors, ({one}) => ({
	dictionary: one(dictionaries, {
		fields: [dictionaryEditors.dictionaryId],
		references: [dictionaries.id]
	}),
	user: one(users, {
		fields: [dictionaryEditors.userId],
		references: [users.id]
	}),
}));

export const couponRedemptionsRelations = relations(couponRedemptions, ({one}) => ({
	coupon: one(coupons, {
		fields: [couponRedemptions.couponId],
		references: [coupons.id]
	}),
	user: one(users, {
		fields: [couponRedemptions.userId],
		references: [users.id]
	}),
}));

export const couponsRelations = relations(coupons, ({many}) => ({
	couponRedemptions: many(couponRedemptions),
}));