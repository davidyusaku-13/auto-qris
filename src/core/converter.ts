import { calculateCRC16 } from "./crc16";
import { parseTLV } from "./parser";
import { validateQRIS } from "./validator";
import type { ConvertOptions, TLV } from "./types";
import { TAGS } from "./types";

/**
 * Rebuild a QRIS string from TLV elements (without CRC).
 */
function buildTLVString(elements: TLV[]): string {
  return elements
    .map((el) => {
      const value = el.children ? buildTLVString(el.children) : el.value;
      const length = value.length.toString().padStart(2, "0");
      return `${el.tag}${length}${value}`;
    })
    .join("");
}

/**
 * Create a TLV element.
 */
function makeTLV(tag: string, value: string, name = ""): TLV {
  return { tag, name, length: value.length, value };
}

/**
 * Build amount + fee TLV elements from options.
 */
function buildAmountTLVs(options: ConvertOptions): TLV[] {
  const result: TLV[] = [];
  const amountStr = options.amount.toString();
  result.push(makeTLV(TAGS.AMOUNT, amountStr, "Transaction Amount"));

  if (options.fee) {
    if (options.fee.type === "fixed") {
      result.push(makeTLV(TAGS.TIP_INDICATOR, "02", "Tip or Convenience Indicator"));
      result.push(
        makeTLV(TAGS.TIP_FIXED, options.fee.value.toString(), "Value of Convenience Fee (Fixed)"),
      );
    } else {
      result.push(makeTLV(TAGS.TIP_INDICATOR, "03", "Tip or Convenience Indicator"));
      result.push(
        makeTLV(TAGS.TIP_PERCENTAGE, options.fee.value.toString(), "Value of Convenience Fee (%)"),
      );
    }
  }

  return result;
}

/**
 * Convert a static QRIS string to dynamic by injecting amount and optional fee.
 *
 * Steps:
 * 1. Validate the input QRIS string
 * 2. Parse the TLV structure
 * 3. Change Point of Initiation Method from "11" (static) to "12" (dynamic)
 * 4. Insert/replace Transaction Amount (tag 54)
 * 5. Optionally insert Tip Indicator (tag 55) and fee value (tag 56/57)
 * 6. Recalculate CRC16 checksum
 *
 * @throws Error if input is invalid or conversion fails
 */
export function convertQRIS(
  qrisString: string,
  options: ConvertOptions,
): string {
  // Validate input first
  const validation = validateQRIS(qrisString);
  if (!validation.valid) {
    throw new Error(`Invalid QRIS: ${validation.errors.join("; ")}`);
  }

  if (options.amount <= 0) {
    throw new Error("Amount must be greater than 0");
  }

  if (options.fee && options.fee.value <= 0) {
    throw new Error("Fee value must be greater than 0");
  }

  const parseResult = parseTLV(qrisString);
  if (!parseResult.ok) {
    throw new Error(`Failed to parse QRIS: ${parseResult.error.message}`);
  }

  const elements = parseResult.elements;

  // Build the new TLV array preserving order, injecting/replacing as needed
  const result: TLV[] = [];
  let amountInserted = false;

  // Tags to skip (we'll re-insert them)
  const managedTags = new Set<string>([TAGS.AMOUNT, TAGS.TIP_INDICATOR, TAGS.TIP_FIXED, TAGS.TIP_PERCENTAGE, TAGS.CRC]);

  for (const el of elements) {
    if (managedTags.has(el.tag)) continue;

    if (el.tag === TAGS.INITIATION_METHOD) {
      // Change static → dynamic
      result.push(makeTLV(TAGS.INITIATION_METHOD, "12", "Point of Initiation Method"));
      continue;
    }

    // Insert amount + fee before tag 58 (Country Code)
    if (el.tag === TAGS.COUNTRY_CODE && !amountInserted) {
      result.push(...buildAmountTLVs(options));
      amountInserted = true;
    }

    result.push(el);
  }

  // Fallback: if tag 58 was missing, append amount at end
  if (!amountInserted) {
    result.push(...buildAmountTLVs(options));
  }

  // Build string without CRC, then append CRC
  const withoutCRC = buildTLVString(result);
  const crcInput = withoutCRC + `${TAGS.CRC}04`;
  const crc = calculateCRC16(crcInput);

  return crcInput + crc;
}
