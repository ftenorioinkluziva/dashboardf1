"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { useSearchParams, useRouter } from "next/navigation"
import type { Session } from "@/lib/types"
import { fetchSessions } from "@/lib/client-data"

export function SessionCards() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const searchParams = useSearchParams()
  const router = useRouter()

  const meetingKey = searchParams.get("meeting")

  useEffect(() => {
    async function loadSessions() {
      if (meetingKey) {
        setLoading(true)
        try {
          const data = await fetchSessions(meetingKey)
          setSessions(data)
        } catch (error) {
          console.error("Erro ao carregar sessões:", error)
        } finally {
          setLoading(false)
        }
      } else {
        setSessions([])
        setLoading(false)
      }
    }

    loadSessions()
  }, [meetingKey])

  // Agrupar sessões por tipo
  const practiceCards = sessions.filter((session) => session.session_type === "Practice")
  const qualifyingCards = sessions.filter((session) => session.session_type === "Qualifying")
  const raceCards = sessions.filter((session) => session.session_type === "Race")

  const navigateToSession = (sessionKey: string) => {
    router.push(`/session/${sessionKey}`)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!meetingKey) {
    return (
      <div className="text-center py-10">
        <p className="text-muted-foreground">Selecione um evento para ver as sessões disponíveis</p>
      </div>
    )
  }

  if (sessions.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-muted-foreground">Nenhuma sessão encontrada para este evento</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Card de Treinos */}
      {practiceCards.length > 0 && (
        <Card className="overflow-hidden">
          <CardHeader className="pb-0">
            <CardTitle>Treinos</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="relative h-48 mb-4 rounded-md overflow-hidden">
              <Image src="/placeholder.svg?height=200&width=400" alt="Imagem de treino" fill className="object-cover" />
            </div>
            <CardDescription className="text-sm">
              Descrição do dashboard de Treinos, aqui o usuário terá acesso a um dashboard específico para as seções de
              Treinos.
            </CardDescription>
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={() => navigateToSession(practiceCards[0].session_key.toString())}>
              Visualizar Treinos
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Card de Classificação */}
      {qualifyingCards.length > 0 && (
        <Card className="overflow-hidden">
          <CardHeader className="pb-0">
            <CardTitle>Qualifying</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="relative h-48 mb-4 rounded-md overflow-hidden">
              <Image
                src="/placeholder.svg?height=200&width=400"
                alt="Imagem de classificação"
                fill
                className="object-cover"
              />
            </div>
            <CardDescription className="text-sm">
              Descrição do dashboard de Qualifying, aqui o usuário terá acesso a um dashboard específico para as seções
              de Qualifying.
            </CardDescription>
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={() => navigateToSession(qualifyingCards[0].session_key.toString())}>
              Visualizar Qualifying
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Card de Corrida */}
      {raceCards.length > 0 && (
        <Card className="overflow-hidden">
          <CardHeader className="pb-0">
            <CardTitle>Corrida</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="relative h-48 mb-4 rounded-md overflow-hidden">
              <Image
                src="/placeholder.svg?height=200&width=400"
                alt="Imagem de corrida"
                fill
                className="object-cover"
              />
            </div>
            <CardDescription className="text-sm">
              Descrição do dashboard de Corrida, aqui o usuário terá acesso a um dashboard específico para as seções de
              Corrida.
            </CardDescription>
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={() => navigateToSession(raceCards[0].session_key.toString())}>
              Visualizar Corrida
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  )
}
