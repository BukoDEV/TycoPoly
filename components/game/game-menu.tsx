"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import type { GameMode } from "@/types/game-types"

interface GameMenuProps {
  onStartGame: (mode: GameMode, playerCount: number) => void
}

export default function GameMenu({ onStartGame }: GameMenuProps) {
  const [selectedMode, setSelectedMode] = useState<GameMode>("offline")
  const [playerCount, setPlayerCount] = useState(3)
  const [roomId, setRoomId] = useState("")

  const handleStartGame = () => {
    onStartGame(selectedMode, playerCount)
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-3xl text-center text-emerald-700 dark:text-emerald-400">TycoPoly</CardTitle>
          <CardDescription className="text-center">Wybierz tryb gry i rozpocznij rozgrywkę</CardDescription>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="offline" onValueChange={(value) => setSelectedMode(value as GameMode)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="offline">Gra offline z AI</TabsTrigger>
              <TabsTrigger value="online">Gra online</TabsTrigger>
            </TabsList>

            <TabsContent value="offline" className="mt-4">
              <div className="space-y-4">
                <div>
                  <Label>Liczba graczy AI</Label>
                  <RadioGroup
                    defaultValue="3"
                    className="flex justify-between mt-2"
                    onValueChange={(value) => setPlayerCount(Number.parseInt(value))}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="2" id="ai-1" />
                      <Label htmlFor="ai-1">1 AI</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="3" id="ai-2" />
                      <Label htmlFor="ai-2">2 AI</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="4" id="ai-3" />
                      <Label htmlFor="ai-3">3 AI</Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="online" className="mt-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="room-id">Kod pokoju (opcjonalnie)</Label>
                  <Input
                    id="room-id"
                    placeholder="Wpisz kod, aby dołączyć do istniejącego pokoju"
                    className="mt-1"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value)}
                  />
                  <p className="text-xs text-gray-500 mt-1">Pozostaw puste, aby utworzyć nowy pokój</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>

        <CardFooter>
          <Button onClick={handleStartGame} className="w-full bg-emerald-600 hover:bg-emerald-700">
            Rozpocznij grę
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
