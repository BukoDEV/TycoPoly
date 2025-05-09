"use client"

import { useState, useEffect, useCallback } from "react"
import { useGameStore } from "@/store/game-store"
import GameBoard3D from "./game-board-3d"
import PlayerPanel from "./player-panel"
import GameControls from "./game-controls"
import PropertyModal from "./property-modal"
import SellPropertyModal from "./sell-property-modal"
import GameMenu from "./game-menu"
import { generateBoard } from "@/lib/board-generator"
import { useAIPlayer } from "@/lib/ai-player"
import { io } from "socket.io-client"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { Player, GameMode } from "@/types/game-types"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

export default function GameContainer() {
  const {
    board,
    players,
    currentPlayerIndex,
    initializeGame,
    movePlayer,
    endTurn,
    isAITurn,
    gameStarted,
    setGameStarted,
    gameMode,
    setGameMode,
    setPlayers,
    doublesCount,
    rentMessage,
    clearRentMessage,
  } = useGameStore()

  const { processAITurn } = useAIPlayer()

  const [showPropertyModal, setShowPropertyModal] = useState(false)
  const [selectedProperty, setSelectedProperty] = useState(null)
  const [socket, setSocket] = useState(null)
  const [roomId, setRoomId] = useState("")
  const [aiThinking, setAiThinking] = useState(false)
  const [lastAiTurnTime, setLastAiTurnTime] = useState(0)

  // First, add state for sidebar collapse
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  // Inicjalizacja Socket.IO dla trybu online
  useEffect(() => {
    if (gameMode === "online" && !socket) {
      const newSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001")

      newSocket.on("connect", () => {
        console.log("Connected to server")
      })

      newSocket.on("gameState", (gameState) => {
        setPlayers(gameState.players)
      })

      newSocket.on("joinedRoom", (data) => {
        setRoomId(data.roomId)
        initializeGame(generateBoard(), data.players)
        setGameStarted(true)
      })

      setSocket(newSocket)

      return () => {
        newSocket.disconnect()
      }
    }
  }, [gameMode, socket, initializeGame, setGameStarted, setPlayers])

  // Funkcja do wykonania ruchu AI - CAŁKOWICIE PRZEPISANA
  const executeAITurn = useCallback(async () => {
    if (!isAITurn() || aiThinking) return

    // Zabezpieczenie przed zbyt częstymi ruchami AI (minimum 3 sekundy między ruchami)
    const now = Date.now()
    if (now - lastAiTurnTime < 3000) {
      setTimeout(executeAITurn, 3000 - (now - lastAiTurnTime))
      return
    }

    setAiThinking(true)
    setLastAiTurnTime(now)

    try {
      // Generuj losowe wartości kostek dla AI
      const dice1 = Math.floor(Math.random() * 6) + 1
      const dice2 = Math.floor(Math.random() * 6) + 1
      const isDoubles = dice1 === dice2
      const diceSum = dice1 + dice2

      console.log(`AI rolling dice: ${dice1} + ${dice2} = ${diceSum}${isDoubles ? " (doubles)" : ""}`)

      // Emituj zdarzenie rzutu kostkami AI
      const aiRollEvent = new CustomEvent("ai-dice-roll", {
        detail: { dice1, dice2 },
      })
      window.dispatchEvent(aiRollEvent)

      // Poczekaj na animację rzutu kostkami
      setTimeout(() => {
        // Wykonaj ruch AI
        movePlayer(currentPlayerIndex, diceSum, isDoubles)

        // Poczekaj na zakończenie animacji ruchu
        setTimeout(() => {
          // Wykonaj logikę AI (kupowanie nieruchomości itp.)
          processAITurn()

          // Jeśli nie wyrzucono dubletu lub to trzeci dublet, zakończ turę
          if (!isDoubles || doublesCount >= 3) {
            setTimeout(() => {
              endTurn()
              setAiThinking(false)
            }, 1000)
          } else {
            console.log("AI wyrzuciło dublet, rzuca ponownie")
            setAiThinking(false)
            // Daj czas na aktualizację UI przed kolejnym ruchem
            setTimeout(executeAITurn, 3000)
          }
        }, 1000)
      }, 3000)
    } catch (error) {
      console.error("Błąd podczas wykonywania ruchu AI:", error)
      // W przypadku błędu, zakończ turę AI
      endTurn()
      setAiThinking(false)
    }
  }, [currentPlayerIndex, movePlayer, endTurn, isAITurn, aiThinking, doublesCount, lastAiTurnTime, processAITurn])

  // Obsługa ruchu AI
  useEffect(() => {
    if (gameStarted && gameMode === "offline" && isAITurn() && !aiThinking) {
      // Dodajemy opóźnienie, aby uniknąć natychmiastowego wykonania ruchu AI
      const timer = setTimeout(executeAITurn, 1500)
      return () => clearTimeout(timer)
    }
  }, [gameStarted, gameMode, currentPlayerIndex, isAITurn, executeAITurn, aiThinking])

  // Automatycznie ukryj komunikat o czynszu po 5 sekundach
  useEffect(() => {
    if (rentMessage) {
      const timer = setTimeout(() => {
        clearRentMessage()
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [rentMessage, clearRentMessage])

  const handleStartGame = (mode: GameMode, playerCount: number) => {
    setGameMode(mode)

    if (mode === "offline") {
      // Tworzenie graczy (w tym AI)
      const initialPlayers: Player[] = [
        {
          id: 1,
          name: "Gracz 1",
          color: "#ef4444",
          money: 1500,
          position: 0,
          properties: [],
          inJail: false,
          jailTurns: 0,
          isAI: false,
          hasCompletedCircuit: false,
        },
      ]

      // Dodaj graczy AI
      for (let i = 2; i <= playerCount; i++) {
        initialPlayers.push({
          id: i,
          name: `AI ${i - 1}`,
          color: i === 2 ? "#3b82f6" : i === 3 ? "#22c55e" : "#f59e0b",
          money: 1500,
          position: 0,
          properties: [],
          inJail: false,
          jailTurns: 0,
          isAI: true,
          hasCompletedCircuit: false,
        })
      }

      initializeGame(generateBoard(), initialPlayers)
      setGameStarted(true)
    } else if (mode === "online" && socket) {
      // Dołącz do pokoju lub stwórz nowy
      socket.emit("createRoom", { playerName: "Gracz 1" })
    }
  }

  const handleDiceRoll = (diceSum: number, isDoubles: boolean) => {
    if (gameMode === "online" && socket) {
      socket.emit("rollDice", { roomId, diceSum, isDoubles })
      return
    }

    movePlayer(currentPlayerIndex, diceSum, isDoubles)

    // Sprawdź, czy gracz wylądował na polu, które można kupić
    const currentPlayer = players[currentPlayerIndex]
    const fieldPosition = currentPlayer.position
    const field = board.find((f) => f.id === fieldPosition)

    if (field && field.type === "property" && !field.ownerId && !currentPlayer.isAI) {
      setSelectedProperty(field)
      setShowPropertyModal(true)
    } else if (!isDoubles || doublesCount >= 3) {
      // Jeśli nie wyrzucono dubletu lub to trzeci dublet, automatycznie kończymy turę
      setTimeout(() => {
        endTurn()
      }, 1000)
    }
  }

  const handlePropertyModalClose = () => {
    setShowPropertyModal(false)
    setSelectedProperty(null)

    // Jeśli nie wyrzucono dubletu, automatycznie kończymy turę po zamknięciu modalu
    if (doublesCount === 0) {
      setTimeout(() => {
        endTurn()
      }, 500)
    }
  }

  const handleEndTurn = () => {
    if (gameMode === "online" && socket) {
      socket.emit("endTurn", { roomId })
      return
    }

    endTurn()
  }

  // Toggle sidebar function - fixed to properly handle state
  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed)
  }

  if (!gameStarted) {
    return <GameMenu onStartGame={handleStartGame} />
  }

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden">
      {/* Either show the HUD (when sidebar is collapsed) or the sidebar (when expanded) */}
      {sidebarCollapsed ? (
        /* Top HUD - visible ONLY when sidebar is collapsed */
        <div className="bg-white/80 dark:bg-gray-800/80 p-2 shadow-md z-10">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold text-emerald-700 dark:text-emerald-400">TycoPoly</h1>
            <div className="flex gap-2">
              {players.map((player, index) => (
                <div
                  key={player.id}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                    index === currentPlayerIndex ? "ring-2 ring-yellow-400" : ""
                  }`}
                  style={{ backgroundColor: player.color }}
                  title={`${player.name}: ${player.money}$`}
                >
                  {player.name.charAt(0)}
                </div>
              ))}
            </div>
            <Button size="sm" variant="outline" onClick={() => setSidebarCollapsed(false)} className="text-emerald-600">
              <span className="sr-only">Expand Sidebar</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        /* Sidebar - visible ONLY when sidebar is expanded */
        <div className="w-80 bg-white/80 dark:bg-gray-800/80 shadow-lg h-full overflow-auto">
          <div className="h-full flex flex-col p-4 relative">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSidebarCollapsed(true)}
              className="absolute top-2 left-2 text-emerald-600"
            >
              <span className="sr-only">Collapse Sidebar</span>
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <h1 className="text-2xl font-bold text-center mb-4 text-emerald-700 dark:text-emerald-400 mt-8">
              TycoPoly
            </h1>

            <PlayerPanel players={players} currentPlayerIndex={currentPlayerIndex} />

            {rentMessage && (
              <Alert className="mt-4 bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
                <AlertDescription>{rentMessage}</AlertDescription>
              </Alert>
            )}

            <div className="mt-4">
              <GameControls onEndTurn={handleEndTurn} />
            </div>

            {aiThinking && (
              <div className="mt-4 p-2 bg-amber-100 dark:bg-amber-900/30 rounded-md">
                <p className="text-sm font-medium">AI wykonuje ruch...</p>
              </div>
            )}

            {roomId && (
              <div className="mt-4 p-2 bg-emerald-100 dark:bg-emerald-900 rounded-md">
                <p className="text-sm font-medium">Kod pokoju: {roomId}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main game board - always visible */}
      <div className="flex-1 flex items-center justify-center">
        <GameBoard3D onDiceRoll={handleDiceRoll} />
      </div>

      {showPropertyModal && selectedProperty && (
        <PropertyModal property={selectedProperty} onClose={handlePropertyModalClose} />
      )}

      <SellPropertyModal />
    </div>
  )
}
