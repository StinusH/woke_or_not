import { NextRequest } from "next/server";

export function isAdminAuthorized(request: NextRequest): boolean {
  const configuredSecret = process.env.ADMIN_SECRET;
  if (!configuredSecret) return false;

  const provided = request.headers.get("x-admin-secret");
  return provided === configuredSecret;
}
