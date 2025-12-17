import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/database";
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) 

{
  try {
    const { id } = await context.params;
    const { enabled } = await request.json();

    if (typeof enabled !== "boolean") {
      return NextResponse.json(
        { success: false, error: "Invalid enabled value" },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `
      UPDATE feature_toggles
      SET enabled = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
      `,
      [enabled, id]
    );

    return NextResponse.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Feature toggle PATCH error:", error);

    return NextResponse.json(
      { success: false, error: "Failed to toggle feature" },
      { status: 500 }
    );
  }
}
