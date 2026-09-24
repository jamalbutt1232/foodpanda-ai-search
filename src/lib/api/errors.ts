import { NextResponse } from "next/server";

export interface ApiError {
  error: string;
}

export function jsonError(message: string, status: number): NextResponse<ApiError> {
  return NextResponse.json({ error: message }, { status });
}

/** Logs the real error server-side; the client only gets a friendly message. */
export function serverError(context: string, error: unknown): NextResponse<ApiError> {
  console.error(`[api] ${context}:`, error);
  return jsonError("Something went wrong on our side. Please try again.", 500);
}
