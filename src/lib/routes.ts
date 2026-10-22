import type { Role } from "./types";

/** Where each kind of user lands after signing in. */
export const homeFor = (role: Role) => (role === "STUDENT" ? "/home" : role === "ADMIN" ? "/admin" : "/guardian");
