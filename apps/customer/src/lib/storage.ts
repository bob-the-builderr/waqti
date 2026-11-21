// Web: the browser's own localStorage keeps the signed-in session.
export const authStorage = typeof window !== 'undefined' ? window.localStorage : undefined;
