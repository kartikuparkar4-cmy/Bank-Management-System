export interface UserProfile {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: "USER" | "ADMIN";
  createdAt: string;
}

export interface AuthSession {
  token: string;
  userId: number;
  name: string;
  email: string;
}

export interface BankAccount {
  id: number;
  accountNumber: string;
  accountType: "SAVINGS" | "CURRENT";
  balance: number;
  active: boolean;
}

export interface BankCard {
  id: number;
  maskedNumber: string;
  cardType: "VISA" | "MASTERCARD" | "CREDIT" | "DEBIT";
  creditLimit: number;
  availableLimit: number;
  expiry?: string;
  cardHolder?: string;
  active: boolean;
}

export interface BankBill {
  id: number;
  billType: string;
  provider: string;
  amount: number;
  dueDate: string;
  status: "PENDING" | "PAID" | "OVERDUE";
}

export interface BankReward {
  id: number;
  points: number;
}

export interface BankTransaction {
  id: number;
  sender: {
    id: number;
    accountNumber: string;
    name: string;
  };
  receiver: {
    id: number;
    accountNumber: string;
    name: string;
  };
  amount: number;
  description: string;
  status: "SUCCESS" | "FAILED";
  createdAt: string;
  type?: "DEBIT" | "CREDIT";
}

export interface FeedbackItem {
  id: number;
  name: string;
  message: string;
  rating: number;
  role?: string;
  avatar?: string;
  createdAt?: string;
}

export interface PublicHealth {
  status: string;
  service: string;
  timestamp?: string;
}

export interface PublicStats {
  uptime: string;
  secure: boolean;
  currency: string;
  activeUsers: string;
  trustedCompanies: string;
  totalTransactionVolume: string;
}

export interface TransferPayload {
  senderAccountId: number;
  receiverAccountNumber: string;
  amount: number;
  description: string;
}

export interface BillPaymentPayload {
  billId: number;
  amount: number;
  accountId: number;
}

export type NotificationType = "LOW_BALANCE" | "TRANSFER" | "SECURITY" | "BILL_DUE" | "SYSTEM";
export type NotificationSeverity = "info" | "warning" | "success" | "critical";

export interface BankNotification {
  id: number;
  userId: number;
  type: NotificationType;
  title: string;
  message: string;
  severity: NotificationSeverity;
  read: boolean;
  actionTab?: "overview" | "accounts" | "insights" | "transfer" | "transactions" | "cards" | "bills" | "rewards" | "notifications";
  actionLabel?: string;
  createdAt: string;
}

export interface SimulateNotificationPayload {
  type: NotificationType;
  title: string;
  message: string;
  severity: NotificationSeverity;
  actionTab?: "overview" | "accounts" | "insights" | "currency" | "transfer" | "transactions" | "cards" | "bills" | "rewards" | "notifications";
  actionLabel?: string;
}

export interface CurrencyInfo {
  code: string;
  name: string;
  symbol: string;
  flag: string;
  country: string;
}

export interface ExchangeRatesData {
  base: string;
  date: string;
  timeLastUpdated: number;
  rates: Record<string, number>;
  source: string;
}

export interface InternationalPaymentQuote {
  sourceAmount: number;
  sourceCurrency: string;
  targetAmount: number;
  targetCurrency: string;
  pureConvertedAmount: number;
  netConvertibleAmount: number;
  exchangeRate: number;
  inverseRate: number;
  hooBankFee: number;
  traditionalBankFee: number;
  userSavings: number;
  guaranteedUntil: string;
  deliverySpeed: string;
  estimatedArrival: string;
  routingMethod: "HOOBANK_GLOBAL_NET" | "SWIFT_EXPRESS" | "SEPA_INSTANT";
}
