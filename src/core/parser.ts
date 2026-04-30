import type { TLV, QRISData, MerchantAccountInfo, ParseResult } from "./types";
import { TAGS, MERCHANT_TAG_RANGE } from "./types";

/** Map of known EMVCo / QRIS tag IDs to human-readable names */
const TAG_NAMES: Record<string, string> = {
  [TAGS.PAYLOAD_FORMAT]: "Payload Format Indicator",
  [TAGS.INITIATION_METHOD]: "Point of Initiation Method",
  "02": "Visa",
  "03": "Mastercard",
  "04": "Mastercard",
  "15": "Visa",
  "26": "Merchant Account Information",
  "27": "Merchant Account Information",
  "28": "Merchant Account Information",
  "29": "Merchant Account Information",
  "30": "Merchant Account Information",
  "31": "Merchant Account Information",
  "32": "Merchant Account Information",
  "33": "Merchant Account Information",
  "34": "Merchant Account Information",
  "35": "Merchant Account Information",
  "36": "Merchant Account Information",
  "37": "Merchant Account Information",
  "38": "Merchant Account Information",
  "39": "Merchant Account Information",
  "40": "Merchant Account Information",
  "41": "Merchant Account Information",
  "42": "Merchant Account Information",
  "43": "Merchant Account Information",
  "44": "Merchant Account Information",
  "45": "Merchant Account Information",
  "46": "Merchant Account Information",
  "47": "Merchant Account Information",
  "48": "Merchant Account Information",
  "49": "Merchant Account Information",
  "50": "Merchant Account Information",
  "51": "Merchant Account Information",
  [TAGS.MERCHANT_CATEGORY]: "Merchant Category Code",
  [TAGS.CURRENCY]: "Transaction Currency",
  [TAGS.AMOUNT]: "Transaction Amount",
  [TAGS.TIP_INDICATOR]: "Tip or Convenience Indicator",
  [TAGS.TIP_FIXED]: "Value of Convenience Fee (Fixed)",
  [TAGS.TIP_PERCENTAGE]: "Value of Convenience Fee (%)",
  [TAGS.COUNTRY_CODE]: "Country Code",
  [TAGS.MERCHANT_NAME]: "Merchant Name",
  [TAGS.MERCHANT_CITY]: "Merchant City",
  [TAGS.POSTAL_CODE]: "Postal Code",
  [TAGS.ADDITIONAL_DATA]: "Additional Data Field",
  [TAGS.CRC]: "CRC",
};

/** Tags that contain nested TLV sub-elements */
const NESTED_TAGS = new Set([
  ...Array.from({ length: 26 }, (_, i) => String(i + 26).padStart(2, "0")),
  TAGS.ADDITIONAL_DATA,
]);

/** Maximum allowed QRIS string length to prevent DoS */
const MAX_INPUT_LENGTH = 4096;

/**
 * Parse a raw TLV string into an array of TLV elements.
 * Returns a ParseResult indicating success or partial failure.
 */
export function parseTLV(data: string): ParseResult {
  if (data.length > MAX_INPUT_LENGTH) {
    return {
      ok: false,
      error: {
        message: `Input too long: ${data.length} chars (max ${MAX_INPUT_LENGTH})`,
        position: 0,
        partialElements: [],
      },
    };
  }

  const elements: TLV[] = [];
  let pos = 0;

  while (pos < data.length) {
    if (pos + 4 > data.length) {
      return {
        ok: false,
        error: {
          message: `Incomplete TLV at position ${pos}: not enough data for tag+length`,
          position: pos,
          partialElements: elements,
        },
      };
    }

    const tag = data.substring(pos, pos + 2);
    const lengthStr = data.substring(pos + 2, pos + 4);
    const length = parseInt(lengthStr, 10);

    if (isNaN(length)) {
      return {
        ok: false,
        error: {
          message: `Invalid length "${lengthStr}" at position ${pos + 2}`,
          position: pos + 2,
          partialElements: elements,
        },
      };
    }

    if (pos + 4 + length > data.length) {
      return {
        ok: false,
        error: {
          message: `Value overflow at tag ${tag}: expected ${length} chars but only ${data.length - pos - 4} available`,
          position: pos + 4,
          partialElements: elements,
        },
      };
    }

    const value = data.substring(pos + 4, pos + 4 + length);
    const name = TAG_NAMES[tag] ?? `Unknown (${tag})`;

    const element: TLV = { tag, name, length, value };

    if (NESTED_TAGS.has(tag)) {
      const childResult = parseTLV(value);
      if (childResult.ok) {
        element.children = childResult.elements;
      } else {
        // Nested parse failed — store raw value, continue
        element.children = childResult.error.partialElements;
      }
    }

    elements.push(element);
    pos += 4 + length;
  }

  return { ok: true, elements };
}

/**
 * Parse a QRIS string into a structured QRISData object.
 * Throws if TLV parsing fails completely.
 */
export function parseQRIS(qrisString: string): QRISData {
  const result = parseTLV(qrisString);

  let raw: TLV[];
  if (result.ok) {
    raw = result.elements;
  } else if (result.error.partialElements.length > 0) {
    raw = result.error.partialElements;
  } else {
    throw new Error(`Failed to parse QRIS: ${result.error.message}`);
  }

  const findTag = (tag: string) => raw.find((t) => t.tag === tag);

  const methodValue = findTag(TAGS.INITIATION_METHOD)?.value;
  const method = methodValue === "12" ? "dynamic" : "static";

  const tipIndicatorValue = findTag(TAGS.TIP_INDICATOR)?.value;
  let tipIndicator: QRISData["tipIndicator"];
  if (tipIndicatorValue === "01") tipIndicator = "prompt";
  else if (tipIndicatorValue === "02") tipIndicator = "fixed";
  else if (tipIndicatorValue === "03") tipIndicator = "percentage";

  // Extract merchant account information (tags 26-51)
  const merchantAccountInfo: MerchantAccountInfo[] = raw
    .filter((t) => {
      const tagNum = parseInt(t.tag, 10);
      return tagNum >= MERCHANT_TAG_RANGE.min && tagNum <= MERCHANT_TAG_RANGE.max && t.children;
    })
    .map((t) => {
      const children = t.children ?? [];
      const findChild = (childTag: string) =>
        children.find((c) => c.tag === childTag);

      return {
        tag: t.tag,
        globallyUniqueId: findChild("00")?.value ?? "",
        merchantId: findChild("01")?.value ?? findChild("02")?.value,
        merchantCriteria: findChild("03")?.value,
        fields: children,
      };
    });

  return {
    version: findTag(TAGS.PAYLOAD_FORMAT)?.value ?? "01",
    method,
    merchantAccountInfo,
    merchantCategoryCode: findTag(TAGS.MERCHANT_CATEGORY)?.value ?? "",
    currency: findTag(TAGS.CURRENCY)?.value ?? "360",
    amount: findTag(TAGS.AMOUNT)?.value,
    tipIndicator,
    tipFixed: findTag(TAGS.TIP_FIXED)?.value,
    tipPercentage: findTag(TAGS.TIP_PERCENTAGE)?.value,
    countryCode: findTag(TAGS.COUNTRY_CODE)?.value ?? "ID",
    merchantName: findTag(TAGS.MERCHANT_NAME)?.value ?? "",
    merchantCity: findTag(TAGS.MERCHANT_CITY)?.value ?? "",
    postalCode: findTag(TAGS.POSTAL_CODE)?.value ?? "",
    additionalData: findTag(TAGS.ADDITIONAL_DATA)?.children,
    crc: findTag(TAGS.CRC)?.value ?? "",
    raw,
  };
}
