import { NextRequest } from "next/server";

export const ADMIN_UNAUTHORIZED_MESSAGE =
  "Admin secret missing or incorrect. Re-enter the deployed ADMIN_SECRET and try again.";

export function isAdminAuthorized(request: NextRequest): boolean {
  const configuredSecret = process.env.ADMIN_SECRET;
  if (!configuredSecret) return false;

  const provided = request.headers.get("x-admin-secret");
  return provided === configuredSecret;
}
