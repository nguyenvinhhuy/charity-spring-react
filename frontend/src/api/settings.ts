import { api } from '@/api/axios';
import type { BankSettings } from "@/types/settings"

/**
 * Fetches the club's default bank account settings (shown on VietQR unless a campaign overrides it).
 */
export async function getBankSettings(): Promise<BankSettings> {
  const { data } = await api.get<BankSettings>('/settings/bank');
  return data;
}

/**
 * Updates the club's default bank account settings (ADMIN only).
 *
 * @param payload the new bank account fields
 */
export async function updateBankSettings(
  payload: BankSettings,
): Promise<BankSettings> {
  const { data } = await api.patch<BankSettings>('/settings/bank', payload);
  return data;
}
