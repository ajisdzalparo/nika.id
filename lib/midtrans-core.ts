import { getMidtransClients } from "@/lib/midtrans";

export const MIDTRANS_CHANNELS = ["QRIS", "BCA", "MANDIRI", "BNI", "BRI", "PERMATA"] as const;
export type MidtransChannel = (typeof MIDTRANS_CHANNELS)[number];

export const MIDTRANS_CHANNEL_LABELS: Record<MidtransChannel, { label: string; short: string }> = {
  QRIS: { label: "QRIS (GoPay, OVO, DANA, ShopeePay, Mobile Banking)", short: "QRIS" },
  BCA: { label: "BCA Virtual Account", short: "BCA VA" },
  MANDIRI: { label: "Mandiri Bill Payment (VA)", short: "Mandiri" },
  BNI: { label: "BNI Virtual Account", short: "BNI VA" },
  BRI: { label: "BRI Virtual Account", short: "BRI VA" },
  PERMATA: { label: "Permata Virtual Account", short: "Permata" },
};

export interface MidtransPaymentDetails {
  mode: "CORE";
  channel: MidtransChannel;
  qrUrl: string | null;
  qrString: string | null;
  vaNumber: string | null;
  bank: string | null;
  billKey: string | null;
  billerCode: string | null;
  expiresAt: string | null;
}

export function parseMidtransDetails(raw: string | null | undefined): MidtransPaymentDetails | null {
  if (!raw || !raw.startsWith("{")) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<MidtransPaymentDetails>;
    if (parsed.mode !== "CORE" || !parsed.channel) return null;
    return {
      mode: "CORE",
      channel: parsed.channel,
      qrUrl: parsed.qrUrl ?? null,
      qrString: parsed.qrString ?? null,
      vaNumber: parsed.vaNumber ?? null,
      bank: parsed.bank ?? null,
      billKey: parsed.billKey ?? null,
      billerCode: parsed.billerCode ?? null,
      expiresAt: parsed.expiresAt ?? null,
    };
  } catch {
    return null;
  }
}

export function resolveMidtransStatus(transactionStatus?: string, fraudStatus?: string): "PENDING" | "SUCCESS" | "FAILED" | "CHALLENGE" {
  if (transactionStatus === "capture") {
    return fraudStatus === "challenge" ? "CHALLENGE" : fraudStatus === "accept" ? "SUCCESS" : "PENDING";
  }
  if (transactionStatus === "settlement") return "SUCCESS";
  if (transactionStatus === "cancel" || transactionStatus === "deny" || transactionStatus === "expire") return "FAILED";
  return "PENDING";
}

function getAppWebhookUrl(): string | null {
  const base = (process.env.NEXT_PUBLIC_APP_URL || process.env.BETTER_AUTH_URL || "").trim().replace(/\/+$/, "");
  if (!base.startsWith("https://")) return null;
  return `${base}/api/payment/notification`;
}

export async function createCoreCharge(params: {
  orderId: string;
  amount: number;
  channel: MidtransChannel;
  customer: { first_name?: string | null; email?: string | null };
  item: { id: string; price: number; name: string };
}): Promise<MidtransPaymentDetails> {
  const { enabled, core } = await getMidtransClients();
  if (!enabled) throw new Error("MIDTRANS_NOT_CONFIGURED");

  const overrideUrl = getAppWebhookUrl();
  const axiosDefaults = (core as unknown as { httpClient?: { http_client?: { defaults?: { headers?: { common?: Record<string, string> } } } } })
    .httpClient?.http_client?.defaults;
  if (overrideUrl && axiosDefaults?.headers?.common) {
    axiosDefaults.headers.common["X-Override-Notification"] = overrideUrl;
  } else if (axiosDefaults?.headers?.common?.["X-Override-Notification"]) {
    delete axiosDefaults.headers.common["X-Override-Notification"];
  }

  const basePayload: Record<string, unknown> = {
    transaction_details: {
      order_id: params.orderId,
      gross_amount: params.amount,
    },
    customer_details: {
      first_name: params.customer.first_name || "Pelanggan",
      email: params.customer.email || undefined,
    },
    item_details: [
      {
        id: params.item.id,
        price: params.item.price,
        quantity: 1,
        name: params.item.name.slice(0, 50),
      },
    ],
  };

  if (params.channel === "QRIS") {
    basePayload.payment_type = "qris";
    basePayload.qris = { acquirer: "gopay" };
  } else if (params.channel === "MANDIRI") {
    basePayload.payment_type = "echannel";
    basePayload.echannel = {
      bill_info1: "Pembayaran:",
      bill_info2: params.item.name.slice(0, 30),
    };
  } else if (params.channel === "PERMATA") {
    basePayload.payment_type = "permata";
  } else {
    basePayload.payment_type = "bank_transfer";
    basePayload.bank_transfer = { bank: params.channel.toLowerCase() };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const res = (await (core as any).charge(basePayload)) as {
    status_code?: string;
    status_message?: string;
    actions?: Array<{ name?: string; url?: string }>;
    qr_string?: string;
    va_numbers?: Array<{ bank?: string; va_number?: string }>;
    permata_va_number?: string;
    bill_key?: string;
    biller_code?: string;
    expiry_time?: string;
  };

  const qrAction =
    res.actions?.find((a) => a.name === "generate-qr-code-v2")?.url ??
    res.actions?.find((a) => a.name === "generate-qr-code")?.url ??
    null;

  const va = res.va_numbers?.[0];
  const vaNumber = va?.va_number ?? res.permata_va_number ?? null;
  const bank = va?.bank?.toUpperCase() ?? (res.permata_va_number ? "PERMATA" : params.channel === "MANDIRI" ? "MANDIRI" : null);

  return {
    mode: "CORE",
    channel: params.channel,
    qrUrl: qrAction,
    qrString: res.qr_string ?? null,
    vaNumber,
    bank,
    billKey: res.bill_key ?? null,
    billerCode: res.biller_code ?? null,
    expiresAt: res.expiry_time ?? null,
  };
}
