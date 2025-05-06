"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function ApiDebugPage() {
  const [testResult, setTestResult] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string>("1234") // ID de sessão de exemplo

  const testEndpoint = async (endpoint: string) => {
    setLoading(true)
    try {
      const response = await fetch(endpoint)
      const status = response.status
      let data = "Não foi possível ler os dados da resposta"

      try {
        data = JSON.stringify(await response.json(), null, 2)
      } catch (e) {
        data = await response.text()
      }

      setTestResult(`Status: ${status}\n\nDados:\n${data}`)
    } catch (error) {
      setTestResult(`Erro: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Diagnóstico de API</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Testar Endpoints</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">ID da Sessão</label>
              <input
                type="text"
                value={sessionId}
                onChange={(e) => setSessionId(e.target.value)}
                className="w-full p-2 border rounded"
              />
            </div>

            <div className="space-y-2">
              <Button onClick={() => testEndpoint("/api/test")} disabled={loading} className="w-full">
                Testar /api/test
              </Button>

              <Button
                onClick={() => testEndpoint(`/api/sessions/${sessionId}/standings`)}
                disabled={loading}
                className="w-full"
              >
                Testar /api/sessions/{sessionId}/standings
              </Button>

              <Button
                onClick={() => testEndpoint(`/api/sessions/${sessionId}/qualifying`)}
                disabled={loading}
                className="w-full"
              >
                Testar /api/sessions/{sessionId}/qualifying
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resultado</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="animate-pulse h-40 bg-gray-200 rounded"></div>
            ) : testResult ? (
              <pre className="bg-gray-100 p-4 rounded overflow-auto h-80 text-xs">{testResult}</pre>
            ) : (
              <div className="text-center py-10 text-gray-500">Clique em um botão para testar um endpoint</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
