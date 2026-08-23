import { NextResponse } from "next/server";

export function successResponse(data: Record<string, unknown>) {
  return NextResponse.json({ success: true, ...data });
}

export function errorResponse(error: string, status: number) {
  return NextResponse.json(
    { success: false, error },
    { status }
  );
}

export function catchResponse(
  error: unknown,
  logLabel: string,
  fallbackMessage: string
) {
  console.error(logLabel, error);
  return errorResponse(
    error instanceof Error ? error.message : fallbackMessage,
    500
  );
}
