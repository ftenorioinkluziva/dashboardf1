import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function GET(request: Request) {
  try {
    console.log("Testing race_control collection access")
    const { db } = await connectToDatabase()

    // Tentar acessar a coleção race_control diretamente
    const count = await db.collection("race_control").countDocuments()

    // Buscar alguns documentos para verificar a estrutura
    const sampleEvents = await db.collection("race_control").find({}).limit(5).toArray()

    return NextResponse.json({
      success: true,
      message: `Successfully accessed race_control collection. Found ${count} documents.`,
      sampleEvents: JSON.parse(JSON.stringify(sampleEvents)),
    })
  } catch (error) {
    console.error("Error accessing race_control collection:", error)
    return NextResponse.json(
      {
        error: "Failed to access race_control collection",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
