import { useEffect, useRef, useState, useMemo } from "react";
import QRCode from "qrcode";
import { parseQRIS } from "@core/index";

interface Props {
  qrisString: string;
}

export function QRISResult({ qrisString }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);

  const parsed = useMemo(() => parseQRIS(qrisString), [qrisString]);

  useEffect(() => {
    if (canvasRef.current && qrisString) {
      QRCode.toCanvas(canvasRef.current, qrisString, {
        width: 280,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
        errorCorrectionLevel: "Q",
      });
    }
  }, [qrisString]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(qrisString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = qrisString;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const link = document.createElement("a");
    link.download = `qris-dynamic-${parsed.merchantName.replace(/\s+/g, "-").toLowerCase()}.png`;
    link.href = canvasRef.current.toDataURL("image/png");
    link.click();
  };

  return (
    <div className="brutal-card overflow-hidden">
      <div className="px-4 py-3 border-b-3 border-black dark:border-white bg-brutal-lime">
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
              d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          Dynamic QRIS Result
        </h2>
      </div>

      <div className="p-6 flex flex-col items-center space-y-4">
        <div className="border-3 border-black p-3 bg-white shadow-brutal">
          <canvas ref={canvasRef} />
        </div>

        <div className="text-center space-y-1">
          <p className="text-sm font-bold uppercase">{parsed.merchantName}</p>
          <p className="text-3xl font-bold text-black dark:text-brutal-yellow">
            Rp {Number(parsed.amount ?? 0).toLocaleString("id-ID")}
          </p>
          {parsed.tipIndicator === "fixed" && parsed.tipFixed && (
            <p className="text-xs font-bold text-black/60 dark:text-white/60">
              + Fee Rp {Number(parsed.tipFixed).toLocaleString("id-ID")}
            </p>
          )}
          {parsed.tipIndicator === "percentage" && parsed.tipPercentage && (
            <p className="text-xs font-bold text-black/60 dark:text-white/60">
              + Fee {parsed.tipPercentage}%
            </p>
          )}
        </div>

        <div className="w-full">
          <div className="border-3 border-black dark:border-white bg-brutal-bg dark:bg-black/30 p-3 break-all font-mono text-xs font-bold max-h-24 overflow-y-auto shadow-brutal-sm dark:shadow-brutal-white-sm">
            {qrisString}
          </div>
        </div>

        <div className="flex gap-3 w-full">
          <button
            onClick={handleCopy}
            className="brutal-btn flex-1 flex items-center justify-center gap-2 text-sm"
          >
            {copied ? (
              <>
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
                    d="M4.5 12.75l6 6 9-13.5"
                  />
                </svg>
                Copied!
              </>
            ) : (
              <>
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
                    d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184"
                  />
                </svg>
                Copy String
              </>
            )}
          </button>

          <button
            onClick={handleDownload}
            className="brutal-btn-primary flex-1 flex items-center justify-center gap-2 text-sm"
          >
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
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
              />
            </svg>
            Download QR
          </button>
        </div>
      </div>
    </div>
  );
}
