import { NextResponse } from "next/server"
import { getQualifyingResults, getSessionById } from "@/lib/data"
// Let's add some debug logging to see what's happening with the data
import { connectToDatabase } from "@/lib/mongodb"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  // Await the params object before accessing its properties
  const resolvedParams = await params
  const sessionId = resolvedParams.id

  // Remover este log

  if (!sessionId) {
    // Remover este log
    return NextResponse.json({ error: "Session ID is required" }, { status: 400 })
  }

  try {
    // Remover este log

    // First get the session to check if it's a Sprint Qualifying
    const session = await getSessionById(sessionId)
    const isSprintQualifying = session?.session_name.includes("Sprint")

    // Remover este log

    // Fetch raw lap data for debugging
    const { db } = await connectToDatabase()
    const rawLaps = await db
      .collection("laps")
      .find({ session_key: Number.parseInt(sessionId) })
      .limit(5)
      .toArray()

    // Remover este log

    const qualifyingResults = await getQualifyingResults(sessionId)

    // If this is a Sprint Qualifying, make sure the stage names use SQ prefix
    if (isSprintQualifying && qualifyingResults.stages) {
      qualifyingResults.stages = qualifyingResults.stages.map((stage, index) => ({
        ...stage,
        name: `SQ${index + 1}`,
      }))

      // Also update the finalGrid to use SQ times instead of Q times
      if (qualifyingResults.finalGrid) {
        qualifyingResults.finalGrid = qualifyingResults.finalGrid.map((driver) => ({
          ...driver,
          // Rename q1Time, q2Time, q3Time to match SQ naming if needed
          // but keep the original values
        }))
      }
    }

    // Add debug information to help troubleshoot
    // Remover este log
    // Remover este log

    return NextResponse.json(qualifyingResults)
  } catch (error) {
    // Capturar erro silenciosamente
    // Return more detailed error information
    return NextResponse.json(
      {
        error: "Failed to fetch qualifying results",
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
