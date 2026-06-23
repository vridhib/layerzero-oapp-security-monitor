export function validateDiscordWebhook(url: string): string | null {
  const pattern = /^https:\/\/discord\.com\/api\/webhooks\/\d+\/[\w-]+$/;
  if (!pattern.test(url)) {
    return 'Invalid Discord webhook URL. Must be like https://discord.com/api/webhooks/1234567890/abc-123...';
  }
  return null;
};

export function validateEmail(email: string): string | null {
  const pattern = /^[^\s@]+@([^\s@.,]+\.)+[^\s@.,]{2,}$/;
  if (!pattern.test(email)) {
    return 'Invalid email address.';
  }
  return null;
};