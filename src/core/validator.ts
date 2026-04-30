import { calculateCRC16 } from "./crc16";
import { parseTLV } from "./parser";
import type { ValidationResult } from "./types";
import { TAGS, MERCHANT_TAG_RANGE } from "./types";

/**
 * Validate a QRIS string for structural correctness.
 */
export function validateQRIS(qrisString: string): ValidationResult {
  const errors: string[] = [];

  if (!qrisString || qrisString.trim().length === 0) {
    return { valid: false, errors: ["QRIS string is empty"] };
  }

  const str = qrisString.trim();

  // Must start with payload format indicator "000201"
  if (!str.startsWith("000201")) {
    errors.push('QRIS must start with Payload Format Indicator "000201"');
  }

  // Minimum length check (header + CRC = at least 20 chars)
  if (str.length < 20) {
    errors.push("QRIS string is too short");
    return { valid: false, errors };
  }

  // CRC validation
  const dataWithoutCRC = str.substring(0, str.length - 4);
  const declaredCRC = str.substring(str.length - 4);
  const calculatedCRC = calculateCRC16(dataWithoutCRC);

  if (declaredCRC.toUpperCase() !== calculatedCRC) {
    errors.push(
      `CRC mismatch: expected ${calculatedCRC}, got ${declaredCRC.toUpperCase()}`,
    );
  }

  // Try to parse TLV structure
  const parseResult = parseTLV(str);
  const elements = parseResult.ok
    ? parseResult.elements
    : parseResult.error.partialElements;

  if (elements.length === 0) {
    errors.push("Failed to parse any TLV elements");
    return { valid: false, errors };
  }

  if (!parseResult.ok) {
    errors.push(`TLV parse warning: ${parseResult.error.message}`);
  }

  // Check required tags
  const tags = new Set(elements.map((e) => e.tag));

  const requiredTags = [
    { tag: TAGS.PAYLOAD_FORMAT, name: "Payload Format Indicator" },
    { tag: TAGS.INITIATION_METHOD, name: "Point of Initiation Method" },
    { tag: TAGS.MERCHANT_CATEGORY, name: "Merchant Category Code" },
    { tag: TAGS.CURRENCY, name: "Transaction Currency" },
    { tag: TAGS.COUNTRY_CODE, name: "Country Code" },
    { tag: TAGS.MERCHANT_NAME, name: "Merchant Name" },
    { tag: TAGS.MERCHANT_CITY, name: "Merchant City" },
    { tag: TAGS.CRC, name: "CRC" },
  ];

  for (const req of requiredTags) {
    if (!tags.has(req.tag)) {
      errors.push(`Missing required tag ${req.tag} (${req.name})`);
    }
  }

  // Check Point of Initiation Method value
  const method = elements.find((e) => e.tag === TAGS.INITIATION_METHOD);
  if (method && method.value !== "11" && method.value !== "12") {
    errors.push(
      `Invalid Point of Initiation Method: "${method.value}" (must be "11" or "12")`,
    );
  }

  // Check at least one merchant account info exists (tags 26-51)
  const hasMerchant = elements.some((e) => {
    const n = parseInt(e.tag, 10);
    return n >= MERCHANT_TAG_RANGE.min && n <= MERCHANT_TAG_RANGE.max;
  });
  if (!hasMerchant) {
    errors.push(`No Merchant Account Information found (tags ${MERCHANT_TAG_RANGE.min}-${MERCHANT_TAG_RANGE.max})`);
  }

  return { valid: errors.length === 0, errors };
}
