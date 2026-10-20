import {
  AuthSession,
  UserProfile,
  BankAccount,
  BankCard,
  BankBill,
  BankReward,
  BankTransaction,
  FeedbackItem,
  PublicHealth,
  PublicStats,
  TransferPayload,
  BillPaymentPayload,
  BankNotification,
  SimulateNotificationPayload,
  ExchangeRatesData,
  InternationalPaymentQuote,
} from "../types";

const TOKEN_KEY = "bank_token";
const USER_KEY = "bank_user";

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function getCurrentUser(): { userId: number; name: string; email: string } | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveSession(auth: AuthSession): void {
  try {
    localStorage.setItem(TOKEN_KEY, auth.token);
    localStorage.setItem(
      USER_KEY,
      JSON.stringify({
        userId: auth.userId,
        name: auth.name,
        email: auth.email,
      })
    );
    window.dispatchEvent(new Event("bank_auth_change"));
  } catch (err) {
    console.error("Failed to save session", err);
  }
}

export function clearSession(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    window.dispatchEvent(new Event("bank_auth_change"));
  } catch (err) {
    console.error("Failed to clear session", err);
  }
}

export function isLoggedIn(): boolean {
  return !!getToken();
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const url = endpoint.startsWith("/") ? `/api${endpoint}` : `/api/${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      // If token expired or invalid, clear local auth
      if (endpoint !== "/auth/login" && endpoint !== "/auth/register") {
        clearSession();
      }
    }
    throw new Error(data.error || data.message || `Request failed with status ${response.status}`);
  }

  return data as T;
}

export const api = {
  // Auth
  register: (body: { name: string; email: string; password: string; phone?: string }) =>
    request<AuthSession>("/auth/register", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  login: (body: { email: string; password: string }) =>
    request<AuthSession>("/auth/login", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  // User & Banking
  profile: () => request<UserProfile>("/users/profile"),
  accounts: () => request<BankAccount[]>("/accounts"),
  cards: async () => {
    const cards = await request<BankCard[]>("/cards");
    return cards.map((card) => ({
      ...card,
      creditLimit: Number(card.creditLimit),
      availableLimit: Number(card.availableLimit),
    }));
  },
  bills: async () => {
    const bills = await request<BankBill[]>("/bills");
    return bills.map((bill) => ({ ...bill, amount: Number(bill.amount) }));
  },
  rewards: () => request<BankReward>("/rewards"),
  transactions: () => request<BankTransaction[]>("/transactions"),

  transfer: (body: TransferPayload) =>
    request<{ id: number; amount: number; status: string; description: string; createdAt: string; newBalance: number }>(
      "/transactions/transfer",
      {
        method: "POST",
        body: JSON.stringify(body),
      }
    ),

  payBill: (body: BillPaymentPayload) =>
    request<{ id: number; billType: string; provider: string; amount: number; status: string; newBalance: number }>(
      "/bills/pay",
      {
        method: "POST",
        body: JSON.stringify(body),
      }
    ),

  addBill: (body: {
    billType: string;
    provider: string;
    amount: number;
    dueDate: string;
  }) =>
    request<BankBill>(
      "/bills",
      {
        method: "POST",
        body: JSON.stringify(body),
      }
    ),

  // Public Feedback
  getFeedback: () => request<FeedbackItem[]>("/feedback"),
  submitFeedback: (body: { name: string; message: string; rating?: number }) =>
    request<FeedbackItem>("/feedback", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  // Public utility
  health: () => request<PublicHealth>("/public/health"),
  stats: () => request<PublicStats>("/public/stats"),

  // Notifications
  getNotifications: () => request<BankNotification[]>("/notifications"),
  markNotificationRead: (id: number) =>
    request<{ success: boolean; notification: BankNotification }>(`/notifications/${id}/read`, {
      method: "PATCH",
    }),
  markAllNotificationsRead: () =>
    request<{ success: boolean; updatedCount: number }>("/notifications/read-all", {
      method: "POST",
    }),
  deleteNotification: (id: number) =>
    request<{ success: boolean; message: string }>(`/notifications/${id}`, {
      method: "DELETE",
    }),
  clearAllNotifications: () =>
    request<{ success: boolean; clearedCount: number }>("/notifications/clear", {
      method: "DELETE",
    }),
  simulateNotification: (body: SimulateNotificationPayload) =>
    request<BankNotification>("/notifications/simulate", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  // Currency & International FX
  getExchangeRates: (base: string = "USD") =>
    request<ExchangeRatesData>(`/currency/rates?base=${encodeURIComponent(base)}`),
  getInternationalQuote: (body: {
    sourceAmount: number;
    sourceCurrency: string;
    targetCurrency: string;
  }) =>
    request<InternationalPaymentQuote>("/currency/calculate-quote", {
      method: "POST",
      body: JSON.stringify(body),
    }),
};
