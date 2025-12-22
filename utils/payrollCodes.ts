export interface PayrollCode {
  description: string;
  paid: boolean;
  paidCategoryMatch: string[];
  bankEffect?: {
    multiplier: number;
    category: string;
  };
  excludeFromTotal?: boolean;
}

export const payrollCodeMap: Record<string, PayrollCode> = {
  WKP: {
    description: "Regular Pay",
    paid: true,
    paidCategoryMatch: ["regular", "regularpay"],
  },
  OST: {
    description: "Overtime",
    paid: true,
    paidCategoryMatch: ["overtime", "overtimstr", "overtime 1.5x"],
  },
  S15: {
    description: "Standby $15",
    paid: true,
    paidCategoryMatch: ["standby", "stndby$15"],
    excludeFromTotal: true,
  },
  UAPD: {
    description: "UAPD Reimb",
    paid: true,
    paidCategoryMatch: ["uapd", "uapd reimb"],
    excludeFromTotal: true,
  },
  FHP: {
    description: "Floating Holiday Pay",
    paid: true,
    paidCategoryMatch: [
      "floating holiday",
      "flthollev",
      "floating holiday pay",
    ],
    bankEffect: { multiplier: -1, category: "Floating Holiday" },
  },
  SLP: {
    description: "Sick Leave Pay",
    paid: true,
    paidCategoryMatch: ["sick", "sick leave", "sick pay"],
    bankEffect: { multiplier: -1, category: "Sick Leave" },
  },
  VAP: {
    description: "Vacation Pay",
    paid: true,
    paidCategoryMatch: ["vacation", "vacation pay"],
    bankEffect: { multiplier: -1, category: "Vacation" },
  },
  CTP: {
    description: "Comp Time Pay",
    paid: true,
    paidCategoryMatch: ["comp time pay", "ctpay", "compensatory"],
    bankEffect: { multiplier: -1, category: "Compensatory Time Off" },
  },
  // Fix: Add missing `paidCategoryMatch` property.
  LHP: {
    description: "Legal Holiday Pay",
    paid: true,
    paidCategoryMatch: ["legal hol", "legal holiday"],
  },
  CTE: {
    description: "Comp Time Earned",
    paid: false,
    paidCategoryMatch: [],
    bankEffect: { multiplier: 1.5, category: "Compensatory Time Off" },
  },
};

const ORDER_DEFINITIONS = [
  ["regular", "regularpay"], // Regular
  ["overtime", "overtimstr"], // Overtime
  ["legal hol", "legal holiday"], // Legal Holiday
  ["vacation", "vacation pay"], // Vacation
  ["sick", "sick pay"], // Sick
  ["standby", "stndby$15"], // Standby
  ["uapd", "uapd reimb"], // UAPD
  ["ctpay", "comp time pay", "compensatory"], // Comp Time
];

export const getPayrollCode = (
  categoryFromPdf: string
): PayrollCode | undefined => {
  const lowerCat = categoryFromPdf.toLowerCase();
  return Object.values(payrollCodeMap).find(
    (code) =>
      code.description.toLowerCase() === lowerCat ||
      code.paidCategoryMatch.some((match) => lowerCat.includes(match))
  );
};

export const getCategorySortIndex = (category: string): number => {
  const lowerCat = category.toLowerCase();
  for (let i = 0; i < ORDER_DEFINITIONS.length; i++) {
    if (ORDER_DEFINITIONS[i].some((match) => lowerCat.includes(match))) {
      return i;
    }
  }
  return 999;
};

export const sortedPayrollCodes = Object.keys(payrollCodeMap).sort((a, b) => {
  const descA = payrollCodeMap[a].description;
  const descB = payrollCodeMap[b].description;
  const idxA = getCategorySortIndex(descA);
  const idxB = getCategorySortIndex(descB);
  if (idxA !== idxB) return idxA - idxB;
  return descA.localeCompare(descB);
});
