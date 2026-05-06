import type { QRISData } from "@core/types";

interface Props {
  data: QRISData;
}

const CURRENCY_MAP: Record<string, string> = {
  "360": "IDR (Rupiah)",
  "840": "USD (Dollar)",
};

const MCC_MAP: Record<string, string> = {
  "4111": "Transportation",
  "4121": "Taxi",
  "4814": "Telecommunication",
  "5311": "Department Store",
  "5411": "Grocery Store",
  "5499": "Food Store",
  "5812": "Restaurant / Eating Places",
  "5814": "Fast Food",
  "5912": "Pharmacy",
  "5999": "Retail Store",
  "7299": "Other Services",
  "8011": "Medical",
  "8999": "Professional Services",
};

export function QRISInfo({ data }: Props) {
  const merchantInfo = data.merchantAccountInfo[0];
  const issuer = merchantInfo?.globallyUniqueId ?? "-";

  return (
    <div className="brutal-card overflow-hidden">
      <div className="px-4 py-3 border-b-3 border-black dark:border-white bg-brutal-cyan">
        <h2 className="text-sm font-bold uppercase tracking-wide flex items-center gap-2 text-black">
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
            />
          </svg>
          QRIS Information
        </h2>
      </div>
      <div className="divide-y-3 divide-black dark:divide-white">
        <InfoRow label="Merchant" value={data.merchantName} />
        <InfoRow label="City" value={data.merchantCity} />
        <InfoRow label="Postal Code" value={data.postalCode} />
        <InfoRow label="Issuer" value={issuer} />
        <InfoRow
          label="Method"
          value={
            <span
              className={`inline-flex border-3 border-black px-2 py-0.5 text-xs font-bold shadow-brutal-sm ${
                data.method === "static"
                  ? "bg-brutal-yellow text-black"
                  : "bg-brutal-lime text-black"
              }`}
            >
              {data.method === "static" ? "STATIC" : "DYNAMIC"}
            </span>
          }
        />
        <InfoRow
          label="Category"
          value={
            MCC_MAP[data.merchantCategoryCode] ?? data.merchantCategoryCode
          }
        />
        <InfoRow
          label="Currency"
          value={CURRENCY_MAP[data.currency] ?? data.currency}
        />
        {data.amount && (
          <InfoRow
            label="Amount"
            value={`Rp ${Number(data.amount).toLocaleString("id-ID")}`}
          />
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="px-4 py-3 flex items-center justify-between gap-4">
      <span className="text-sm font-bold uppercase tracking-wide text-black/60 dark:text-white/60 shrink-0">
        {label}
      </span>
      <span className="text-sm font-bold text-right truncate">{value}</span>
    </div>
  );
}
