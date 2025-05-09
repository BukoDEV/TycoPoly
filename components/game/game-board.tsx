"use client"

import { useState, useEffect } from "react"
import { useGameStore } from "@/store/game-store"
import BoardField from "./board-field"
import PlayerPanel from "./player-panel"
import DiceRoller from "./dice-roller"
import GameControls from "./game-controls"
import PropertyModal from "./property-modal"
import { generateBoard } from "@/lib/board-generator"
import type { Player } from "@/types/game-types"

export default function GameBoard() {
  const { board, players, currentPlayerIndex, initializeGame, movePlayer, endTurn } = useGameStore()

  const [showPropertyModal, setShowPropertyModal] = useState(false)
  const [selectedProperty, setSelectedProperty] = useState(null)
  const [gameStarted, setGameStarted] = useState(false)

  // Inicjalizacja gry
  useEffect(() => {
    if (!gameStarted) {
      const initialPlayers: Player[] = [
        { id: 1, name: "Gracz 1", color: "#ef4444", money: 1500, position: 0, properties: [], inJail: false },
        { id: 2, name: "Gracz 2", color: "#3b82f6", money: 1500, position: 0, properties: [], inJail: false },
        { id: 3, name: "Gracz 3", color: "#22c55e", money: 1500, position: 0, properties: [], inJail: false },
        { id: 4, name: "Gracz 4", color: "#f59e0b", money: 1500, position: 0, properties: [], inJail: false },
      ]

      initializeGame(generateBoard(), initialPlayers)
      setGameStarted(true)
    }
  }, [initializeGame, gameStarted])

  const handleDiceRoll = (diceSum: number) => {
    movePlayer(currentPlayerIndex, diceSum)

    // Sprawdź, czy gracz wylądował na polu, które można kupić
    const currentPlayer = players[currentPlayerIndex]
    const fieldPosition = currentPlayer.position
    const field = board[fieldPosition]

    if (field.type === "property" && !field.ownerId) {
      setSelectedProperty(field)
      setShowPropertyModal(true)
    }
  }

  const handlePropertyModalClose = () => {
    setShowPropertyModal(false)
    setSelectedProperty(null)
  }

  const handleEndTurn = () => {
    endTurn()
  }

  if (!gameStarted || !board.length) {
    return <div className="text-center p-8">Ładowanie gry...</div>
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl p-4 overflow-hidden">
          <div className="grid grid-cols-11 grid-rows-11 gap-0.5 aspect-square">
            {/* Renderowanie planszy - 40 pól w kwadracie */}
            {board.map((field, index) => (
              <BoardField
                key={index}
                field={field}
                position={index}
                players={players.filter((p) => p.position === index)}
              />
            ))}

            {/* Środek planszy */}
            <div className="col-start-2 col-end-11 row-start-2 row-end-11 flex flex-col items-center justify-center bg-emerald-50 dark:bg-emerald-900/30 rounded-lg">
              <h2 className="text-2xl font-bold mb-4 text-emerald-700 dark:text-emerald-300">Webopoly</h2>
              <DiceRoller onRoll={handleDiceRoll} />
              <div className="mt-4">
                <GameControls onEndTurn={handleEndTurn} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="lg:col-span-1">
        <PlayerPanel players={players} currentPlayerIndex={currentPlayerIndex} />
      </div>

      {showPropertyModal && selectedProperty && (
        <PropertyModal property={selectedProperty} onClose={handlePropertyModalClose} />
      )}
    </div>
  )
}
