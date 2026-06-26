export function tokenFor(user) {
  return Buffer.from(`${user.id}:${user.role}:${Date.now()}`).toString("base64url");
}
