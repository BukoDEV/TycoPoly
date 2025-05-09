"use client"

import { Button } from "@/components/ui/button"
import { useGameStore } from "@/store/game-store"

export default function JailControls() {
  const { players, currentPlayerIndex, payJailFee, jailTurns } = useGameStore()
  const currentPlayer = players[currentPlayerIndex]

  // Sprawdź, czy gracz jest w więzieniu
  if (!currentPlayer?.inJail) {
    return null
  }

  // Sprawdź, czy gracz ma wystarczająco pieniędzy, aby zapłacić kaucję
  const canPayFee = currentPlayer.money >= 200

  // Pobierz liczbę tur w więzieniu
  const turnsInJail = jailTurns[currentPlayerIndex]

  return (
    <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
      <h3 className="text-lg font-semibold mb-2">Jesteś w więzieniu!</h3>
      <p className="text-sm mb-3">
        Tura w więzieniu: {turnsInJail}/3
        {turnsInJail === 3 && " (ostatnia)"}
      </p>
      <div className="space-y-2">
        <p className="text-sm">Możesz wyjść z więzienia na dwa sposoby:</p>
        <ol className="text-sm list-decimal list-inside space-y-1">
          <li>Zapłać 200$ kaucji</li>
          <li>Wyrzuć dublet w następnym rzucie</li>
        </ol>

        <Button
          onClick={() => payJailFee(currentPlayerIndex)}
          disabled={!canPayFee}
          className="w-full mt-2"
          variant="outline"
        >
          Zapłać 200$ i wyjdź z więzienia
        </Button>

        {!canPayFee && (
          <p className="text-xs text-red-500 mt-1">Nie masz wystarczająco pieniędzy, aby zapłacić kaucję!</p>
        )}
      </div>
    </div>
  )
}
