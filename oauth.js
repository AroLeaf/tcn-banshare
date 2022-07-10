const base = 'https://discord.com/api/v9/';

module.exports = {
  async user(options) {
    const res = await fetch(base + 'users/@me', { headers: { Authorization: `Bearer ${options.access_token}` } });
    if (!res.ok) {
      console.error(await res.json());
      throw new Error(res.status);
    }
    return await res.json();
  },

  async token(options) {
    const res = await fetch(base + 'oauth2/token', { method: 'POST', body: new URLSearchParams({
      ...options,
      grant_type: 'authorization_code',
    }) });
    if (!res.ok) {
      console.error(await res.json());
      throw new Error(res.status);
    }
    return await res.json();
  },
}