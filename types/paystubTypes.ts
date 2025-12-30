export interface HourEntry {
  category: string;
  hours: number;
}

export interface ReportedHourEntry {
  code: string;
  hours: number;
}

export interface PaycheckData {
  id?: number | string;
  payPeriodStart: string;
  payPeriodEnd: string;
  paidHours: HourEntry[];
  bankedHours: HourEntry[];
  userReportedHours?: {
    week1?: ReportedHourEntry[];
    week2?: ReportedHourEntry[];
  };
  pdfUrl?: string;
}
