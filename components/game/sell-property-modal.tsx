"use client"

import { useState } from "react"
import { useGameStore } from "@/store/game-store"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function SellPropertyModal() {
  const {
    board,
    players,
    currentPlayerIndex,
    showSellPropertyModal,
    setShowSellPropertyModal,
    sellProperty,
    debtInfo,
    payDebt,
  } = useGameStore()

  const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(null)

  const currentPlayer = players[currentPlayerIndex]

  // Pobierz nieruchomości gracza
  const playerProperties =
    currentPlayer?.properties.map((propId) => board.find((field) => field.id === propId)).filter(Boolean) || []

  // Oblicz cenę sprzedaży nieruchomości (połowa ceny zakupu)
  const getSellPrice = (property) => {
    let price = Math.floor((property.price || 0) / 2)

    // Dodaj wartość domów
    if (property.houses) {
      const housePrice = getHousePrice(property.color)
      price += Math.floor((housePrice * property.houses) / 2)
    }

    return price
  }

  // Funkcja pomocnicza do obliczania ceny domu
  function getHousePrice(color: string): number {
    const colorGroups = {
      "#8B4513": 50, // Brązowe
      "#87CEEB": 50, // Jasnoniebieskie
      "#FF69B4": 100, // Różowe
      "#FFA500": 100, // Pomarańczowe
      "#FF0000": 150, // Czerwone
      "#FFFF00": 150, // Żółte
      "#008000": 200, // Zielone
      "#000080": 200, // Granatowe
    }
    return colorGroups[color] || 100
  }

  const handleSellProperty = () => {
    if (selectedPropertyId !== null) {
      sellProperty(currentPlayerIndex, selectedPropertyId)
      setSelectedPropertyId(null)

      // Sprawdź, czy gracz ma teraz wystarczająco pieniędzy, aby zapłacić dług
      if (debtInfo && currentPlayer.money >= debtInfo.amount) {
        payDebt()
      }
    }
  }

  const handleClose = () => {
    // Jeśli gracz ma wystarczająco pieniędzy, zapłać dług
    if (debtInfo && currentPlayer.money >= debtInfo.amount) {
      payDebt()
    } else if (debtInfo) {
      // Jeśli gracz nadal nie ma wystarczająco pieniędzy, a nie ma już nieruchomości
      if (playerProperties.length === 0) {
        // Gracz bankrutuje - można dodać logikę bankructwa
        alert(`${currentPlayer.name} bankrutuje! Nie ma wystarczająco pieniędzy, aby zapłacić czynsz.`)
        setShowSellPropertyModal(false)
      }
    } else {
      setShowSellPropertyModal(false)
    }
  }

  return (
    <Dialog open={showSellPropertyModal} onOpenChange={setShowSellPropertyModal}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sprzedaj nieruchomość</DialogTitle>
        </DialogHeader>

        {debtInfo && (
          <Alert className="mb-4 bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800">
            <AlertDescription>
              Musisz zapłacić {debtInfo.amount}$ czynszu. Masz tylko {currentPlayer?.money}$. Sprzedaj nieruchomości,
              aby zdobyć brakujące {debtInfo.amount - currentPlayer?.money}$.
            </AlertDescription>
          </Alert>
        )}

        <div className="py-4">
          <div className="text-sm mb-2">
            Twoje pieniądze: <span className="font-bold">{currentPlayer?.money}$</span>
          </div>

          <div className="space-y-2 max-h-60 overflow-auto">
            {playerProperties.length === 0 ? (
              <div className="text-center py-4 text-gray-500">Nie posiadasz żadnych nieruchomości</div>
            ) : (
              playerProperties.map((property) => (
                <div
                  key={property.id}
                  className={`p-3 border rounded-md cursor-pointer transition-colors ${
                    selectedPropertyId === property.id
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                      : "hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                  onClick={() => setSelectedPropertyId(property.id)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium">{property.name}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: property.color }}></div>
                        <span className="text-xs text-gray-500">
                          {property.houses
                            ? property.houses === 5
                              ? "Hotel"
                              : `${property.houses} dom(y)`
                            : "Brak budynków"}
                        </span>
                      </div>
                    </div>
                    <Badge variant="outline">Cena sprzedaży: {getSellPrice(property)}$</Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={handleClose}>
            {debtInfo && playerProperties.length === 0 ? "Bankrutuj" : "Anuluj"}
          </Button>
          <Button
            onClick={handleSellProperty}
            disabled={selectedPropertyId === null}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            Sprzedaj wybraną nieruchomość
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
