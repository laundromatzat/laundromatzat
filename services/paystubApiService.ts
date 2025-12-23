import { PaycheckData } from "../types/paystubTypes";
import { getApiUrl } from "../utils/api";

let authToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
};

const getHeaders = () => {
  const headers: Record<string, string> = {};
  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }
  return headers;
};

export const analyzePaycheckPdf = async (file: File): Promise<PaycheckData> => {
  const formData = new FormData();
  formData.append("paystub", file);

  const response = await fetch(getApiUrl("/analyze"), {
    method: "POST",
    headers: getHeaders(),
    body: formData,
  });

  if (!response.ok) {
    if (response.status === 401) throw new Error("Unauthorized");
    const errorData = await response
      .json()
      .catch(() => ({ error: "Unknown error" }));
    throw new Error(errorData.error || "Failed to analyze paystub");
  }

  const data = await response.json();
  return data;
};

export const fetchPaychecks = async (): Promise<PaycheckData[]> => {
  const response = await fetch(getApiUrl("/paychecks"), {
    headers: getHeaders(),
  });

  if (!response.ok) {
    if (response.status === 401) throw new Error("Unauthorized");
    throw new Error("Failed to fetch paychecks");
  }

  const data = await response.json();
  return data;
};

export const updatePaycheckReportedHours = async (
  id: number | string,
  userReportedHours: { [key: string]: unknown[] }
): Promise<void> => {
  const response = await fetch(getApiUrl(`/paychecks/${id}`), {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...getHeaders(),
    },
    body: JSON.stringify({ userReportedHours }),
  });

  if (!response.ok) {
    if (response.status === 401) throw new Error("Unauthorized");
    const errorData = await response
      .json()
      .catch(() => ({ error: "Failed to update reported hours." }));
    throw new Error(
      errorData.error || "An unknown error occurred during update."
    );
  }
};

export const clearAllData = async (): Promise<void> => {
  const response = await fetch(getApiUrl("/paychecks"), {
    method: "DELETE",
    headers: getHeaders(),
  });

  if (!response.ok) {
    if (response.status === 401) throw new Error("Unauthorized");
    throw new Error("Failed to clear data");
  }
};
