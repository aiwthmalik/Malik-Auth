export interface DiscordPayload {
  username?: string;
  content?: string;
  embeds?: Array<{
    title?: string;
    description?: string;
    color?: number;
    fields?: Array<{ name: string; value: string; inline?: boolean }>;
    timestamp?: string;
  }>;
}

export async function sendDiscordNotification(
  webhookUrl: string,
  payload: DiscordPayload
): Promise<{ success: boolean; statusCode?: number }> {
  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'MalikAuth', ...payload }),
    });
    return { success: res.ok || res.status === 204, statusCode: res.status };
  } catch {
    return { success: false };
  }
}

export async function sendTelegramNotification(
  botToken: string,
  chatId: string,
  message: string
): Promise<{ success: boolean; statusCode?: number }> {
  try {
    const res = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: 'Markdown' }),
      }
    );
    return { success: res.ok, statusCode: res.status };
  } catch {
    return { success: false };
  }
}

export function createNotification(
  type: 'system' | 'security' | 'update' | 'billing' | 'custom',
  title: string,
  message: string
) {
  return {
    id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    type,
    title,
    message,
    read: false,
    timestamp: new Date().toISOString(),
    actionUrl: undefined as string | undefined,
  };
}

export function formatNotificationTime(timestamp: string): string {
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const diff = now - then;

  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return 'just now';

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  return new Date(timestamp).toLocaleDateString();
}
