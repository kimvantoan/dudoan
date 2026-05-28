export function getUserAvatar(username: string): string {
  const seed = username ? username.trim() : 'user';
  return `https://robohash.org/${encodeURIComponent(seed)}?set=set4`;
}
