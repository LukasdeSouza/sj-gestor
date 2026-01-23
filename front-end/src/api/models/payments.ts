import { fetchUseQuery, ApiErrorQuery } from '@/api/services/fetchUseQuery';

export type PaymentStatus = 'PENDING' | 'PROOF_UPLOADED' | 'APPROVED' | 'REJECTED' | 'CANCELED';

export interface PixPaymentResponse {
  subscriptionId: string;
  planId: string;
  amount: number;
  pixQrCode: string;
  pixKey: string;
  accountHolder: string;
}

export interface PaymentDetailsResponse {
  id: string;
  status: PaymentStatus;
  planId: string;
  amount: number;
  proofUrl: string | null;
  proofUploadedAt: string | null;
  approvedAt: string | null;
  approvedByAdminId: string | null;
  rejectedAt: string | null;
  activatedAt: string | null;
  canceledAt: string | null;
}

export interface PaymentHistoryItem {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  planId: string;
  amount: number;
  status: PaymentStatus;
  proofUrl: string | null;
  proofUploadedAt: string | null;
  approvedAt: string | null;
  approvedByAdminId: string | null;
  approvedByAdminName: string | null;
  rejectedAt: string | null;
  createdAt: string;
}

/**
 * Select a plan and create a PIX payment
 */
export async function selectPixPlan(planId: string): Promise<PixPaymentResponse> {
  return fetchUseQuery<{ planId: string }, PixPaymentResponse>({
    route: '/payments/pix/select-plan',
    method: 'POST',
    data: { planId },
  });
}

/**
 * Upload payment proof
 */
export async function uploadPaymentProof(
  paymentId: string,
  file: File
): Promise<{ proofUrl: string }> {
  const formData = new FormData();
  formData.append('proof', file);

  const response = await fetch(`/payments/${paymentId}/upload-proof`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Erro ao enviar comprovante');
  }

  const data = await response.json();
  return data.data || { proofUrl: '' };
}

/**
 * Get user's current payment
 */
export async function getUserPayment(): Promise<PaymentDetailsResponse | null> {
  try {
    return await fetchUseQuery<undefined, PaymentDetailsResponse>({
      route: '/payments/me',
      method: 'GET',
    });
  } catch (error: any) {
    if (error.statusCode === 404) {
      return null;
    }
    throw error;
  }
}

/**
 * Get payment details by ID
 */
export async function getPaymentDetails(paymentId: string): Promise<PaymentDetailsResponse> {
  return fetchUseQuery<undefined, PaymentDetailsResponse>({
    route: `/payments/${paymentId}`,
    method: 'GET',
  });
}

/**
 * Cancel a payment
 */
export async function cancelPayment(paymentId: string): Promise<void> {
  await fetchUseQuery<undefined, void>({
    route: `/payments/${paymentId}/cancel`,
    method: 'PUT',
  });
}

/**
 * List all payments (admin only)
 */
export async function listAllPayments(filters?: {
  status?: PaymentStatus;
  userId?: string;
}): Promise<PaymentHistoryItem[]> {
  const params = new URLSearchParams();
  if (filters?.status) params.append('status', filters.status);
  if (filters?.userId) params.append('userId', filters.userId);

  const query = params.toString() ? `?${params.toString()}` : '';

  return fetchUseQuery<undefined, PaymentHistoryItem[]>({
    route: `/admin/payments${query}`,
    method: 'GET',
  });
}

/**
 * Approve a payment (admin only)
 */
export async function approvePayment(paymentId: string): Promise<void> {
  await fetchUseQuery<undefined, void>({
    route: `/admin/payments/${paymentId}/approve`,
    method: 'PUT',
  });
}

/**
 * Reject a payment (admin only)
 */
export async function rejectPayment(paymentId: string): Promise<void> {
  await fetchUseQuery<undefined, void>({
    route: `/admin/payments/${paymentId}/reject`,
    method: 'PUT',
  });
}
