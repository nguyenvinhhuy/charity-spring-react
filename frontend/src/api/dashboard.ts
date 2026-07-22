import { api } from '@/api/axios';
import type { DashboardSummary, Granularity } from '@/types';

/**
 * Fetch the aggregated dashboard summary, with the donation series bucketed by granularity.
 *
 * @param granularity the bucket size for the donation series
 */
export async function getDashboardSummary(
  granularity: Granularity = 'MONTH',
): Promise<DashboardSummary> {
  const { data } = await api.get<DashboardSummary>('/dashboard/summary', {
    params: { granularity },
  });
  return data;
}
