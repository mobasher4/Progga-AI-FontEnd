// Language-neutral helpers. Anything shown as words (class labels, "2h ago",
// greetings, durations) lives in useFormat() in src/i18n so it follows the
// selected language.

export const firstName = (name?: string) => name?.split(" ")[0] ?? "";

export const GRADES = [3, 4, 5, 6, 7, 8, 9, 10];
