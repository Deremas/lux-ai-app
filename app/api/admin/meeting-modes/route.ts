import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { meetingMode } from "@/db/schema";

// Create a new meeting mode
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, details, meetingTypeId } = body;

  try {
    const newMeetingMode = await db
      .insert(meetingMode)
      .values({
        name,
        details,
        meetingTypeId,
      })
      .returning();

    return NextResponse.json(newMeetingMode, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to create meeting mode", details: message },
      { status: 500 },
    );
  }
}

// Fetch all meeting modes
export async function GET() {
  try {
    const meetingModes = await db.select().from(meetingMode);
    return NextResponse.json(meetingModes, { status: 200 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to fetch meeting modes", details: message },
      { status: 500 },
    );
  }
}
