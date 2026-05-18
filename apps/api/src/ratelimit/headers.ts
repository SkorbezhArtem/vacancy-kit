import type { Context } from 'hono'

export const VK_QUOTA_LIMIT_HEADER = 'x-vk-quota-limit'
export const VK_QUOTA_REMAINING_HEADER = 'x-vk-quota-remaining'
export const VK_QUOTA_RESET_HEADER = 'x-vk-quota-reset'

export function setVkQuotaHeaders(
  c: Context,
  limit: number,
  remaining: number,
  resetsAt: number,
): void {
  c.header(VK_QUOTA_LIMIT_HEADER, String(limit))
  c.header(VK_QUOTA_REMAINING_HEADER, String(remaining))
  c.header(VK_QUOTA_RESET_HEADER, new Date(resetsAt).toISOString())
}
