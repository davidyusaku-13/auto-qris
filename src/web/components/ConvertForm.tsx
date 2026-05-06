import { useState } from "react";
import type { QRISData, ConvertOptions } from "@core/types";

interface Props {
  parsed: QRISData;
  onConvert: (options: ConvertOptions) => void;
}

type FeeType = "none" | "fixed" | "percentage";

export function ConvertForm({ parsed, onConvert }: Props) {
  const [amount, setAmount] = useState("");
  const [feeType, setFeeType] = useState<FeeType>("none");
  const [feeValue, setFeeValue] = useState("");

  if (parsed.method === "dynamic") {
    return (
      <div className="border-3 border-black dark:border-white bg-brutal-lime p-4 shadow-brutal dark:shadow-brutal-white">
        <p className="text-sm font-bold text-black flex items-center gap-2">
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          This QRIS is already dynamic with amount Rp{" "}
          {Number(parsed.amount ?? 0).toLocaleString("id-ID")}
        </p>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseInt(amount, 10);
    if (isNaN(amountNum) || amountNum <= 0) return;

    const options: ConvertOptions = { amount: amountNum };

    if (feeType !== "none" && feeValue) {
      const feeNum = parseFloat(feeValue);
      if (!isNaN(feeNum) && feeNum > 0) {
        options.fee = { type: feeType, value: feeNum };
      }
    }

    onConvert(options);
  };

  return (
    <form onSubmit={handleSubmit} className="brutal-card overflow-hidden">
      <div className="px-4 py-3 border-b-3 border-black dark:border-white bg-brutal-orange">
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
              d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z"
            />
          </svg>
          Convert to Dynamic
        </h2>
      </div>

      <div className="p-4 space-y-4">
        <div>
          <label className="block text-sm font-bold uppercase tracking-wide mb-2">
            Amount (Rupiah)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-black/50 dark:text-white/50">
              Rp
            </span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              min="1"
              required
              className="brutal-input pl-10"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold uppercase tracking-wide mb-2">
            Service Fee
          </label>
          <div className="flex gap-2">
            {(["none", "fixed", "percentage"] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => {
                  setFeeType(type);
                  setFeeValue("");
                }}
                className={`flex-1 py-2 px-3 text-sm font-bold border-3 border-black dark:border-white transition-all ${
                  feeType === type
                    ? "bg-brutal-purple text-black shadow-brutal-sm translate-x-[-1px] translate-y-[-1px] dark:shadow-brutal-white-sm"
                    : "bg-white dark:bg-brutal-dark hover:translate-x-px hover:translate-y-px shadow-brutal-sm hover:shadow-none dark:shadow-brutal-white-sm dark:hover:shadow-none"
                }`}
              >
                {type === "none"
                  ? "None"
                  : type === "fixed"
                    ? "Fixed (Rp)"
                    : "Percent (%)"}
              </button>
            ))}
          </div>
        </div>

        {feeType !== "none" && (
          <div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-black/50 dark:text-white/50">
                {feeType === "fixed" ? "Rp" : "%"}
              </span>
              <input
                type="number"
                value={feeValue}
                onChange={(e) => setFeeValue(e.target.value)}
                placeholder="0"
                min="0"
                step={feeType === "percentage" ? "0.1" : "1"}
                className="brutal-input pl-10"
              />
            </div>
          </div>
        )}

        <button type="submit" className="brutal-btn-primary w-full text-sm uppercase tracking-wide">
          Convert to Dynamic QRIS
        </button>
      </div>
    </form>
  );
}
