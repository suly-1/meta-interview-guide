/**
 * admin router — re-exports adminUsers procedures under the `admin` namespace.
 * This allows admin pages to call `trpc.admin.*` in addition to `trpc.adminUsers.*`.
 */
export { adminUsersRouter as adminRouter } from "./adminUsers";
