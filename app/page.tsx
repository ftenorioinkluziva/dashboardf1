import { Header } from "@/components/header"
import { EventSelector } from "@/components/event-selector"
import { SessionCards } from "@/components/session-cards"
import { getMeetings } from "@/lib/data"

export default async function Home() {
  const meetings = await getMeetings()

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold mb-2">Bem-vindo ao Dashboard F1</h1>
          <p className="text-muted-foreground">Selecione uma sessão e um piloto para visualizar os dados.</p>
        </div>

        <EventSelector meetings={meetings} />

        <div className="mt-10">
          <SessionCards />
        </div>
      </main>
    </div>
  )
}
