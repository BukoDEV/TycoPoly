"use client"

import { Button } from "@/components/ui/button"
import { useGameStore } from "@/store/game-store"
import JailControls from "./jail-controls"

interface GameControlsProps {
  onEndTurn: () => void
}

export default function GameControls({ onEndTurn }: GameControlsProps) {
  const { players, currentPlayerIndex, setIsRolling, canRollDice } = useGameStore()
  const currentPlayer = players[currentPlayerIndex]

  const handleRollClick = () => {
    if (typeof window.rollDice === "function") {
      try {
        const result = window.rollDice()
        if (result instanceof Promise) {
          result.catch((error) => {
            console.error("Error in rollDice:", error)
            // Make sure we reset isRolling state even if there's an error
            setTimeout(() => setIsRolling(false), 500)
          })
        } else {
          // If it's not a Promise, ensure we reset the state after a delay
          setTimeout(() => setIsRolling(false), 500)
        }
      } catch (error) {
        console.error("Exception calling rollDice:", error)
        setIsRolling(false)
      }
    } else {
      console.error("window.rollDice is not defined")
      setIsRolling(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        onClick={handleRollClick}
        disabled={!canRollDice}
        className="bg-emerald-600 hover:bg-emerald-700 text-white"
      >
        Rzuć kostkami
      </Button>

      <Button
        onClick={onEndTurn}
        variant="outline"
        className="border-emerald-600 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950"
      >
        Zakończ turę
      </Button>

      {/* Kontrolki więzienia */}
      <JailControls />
    </div>
  )
}
