/** Known QRIS/EMVCo tag identifiers */
export const TAGS = {
  PAYLOAD_FORMAT: "00",
  INITIATION_METHOD: "01",
  MERCHANT_CATEGORY: "52",
  CURRENCY: "53",
  AMOUNT: "54",
  TIP_INDICATOR: "55",
  TIP_FIXED: "56",
  TIP_PERCENTAGE: "57",
  COUNTRY_CODE: "58",
  MERCHANT_NAME: "59",
  MERCHANT_CITY: "60",
  POSTAL_CODE: "61",
  ADDITIONAL_DATA: "62",
  CRC: "63",
} as const;

/** Range of merchant account info tags (26–51) */
export const MERCHANT_TAG_RANGE = { min: 26, max: 51 } as const;

/** A single TLV (Tag-Length-Value) element from a QRIS payload */
export interface TLV {
  tag: string;
  name: string;
  length: number;
  value: string;
  children?: TLV[];
}

/** Error returned when TLV parsing fails partway */
export interface ParseError {
  message: string;
  position: number;
  partialElements: TLV[];
}

/** Result of parseTLV — either success or partial failure */
export type ParseResult =
  | { ok: true; elements: TLV[] }
  | { ok: false; error: ParseError };

/** Parsed QRIS data in a human-friendly structure */
export interface QRISData {
  version: string;
  method: "static" | "dynamic";
  merchantAccountInfo: MerchantAccountInfo[];
  merchantCategoryCode: string;
  currency: string;
  amount?: string;
  tipIndicator?: "prompt" | "fixed" | "percentage";
  tipFixed?: string;
  tipPercentage?: string;
  countryCode: string;
  merchantName: string;
  merchantCity: string;
  postalCode: string;
  additionalData?: TLV[];
  crc: string;
  raw: TLV[];
}

export interface MerchantAccountInfo {
  tag: string;
  globallyUniqueId: string;
  merchantId?: string;
  merchantCriteria?: string;
  fields: TLV[];
}

/** Fee configuration for conversion */
export interface FeeConfig {
  type: "fixed" | "percentage";
  value: number;
}

export interface ConvertOptions {
  amount: number;
  fee?: FeeConfig;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}
