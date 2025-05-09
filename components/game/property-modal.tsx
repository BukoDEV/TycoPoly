"use client"

import { useState } from "react"
import type { Field } from "@/types/game-types"
import { useGameStore } from "@/store/game-store"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"

interface PropertyModalProps {
  property: Field
  onClose: () => void
}

export default function PropertyModal({ property, onClose }: PropertyModalProps) {
  const { buyProperty, buyHouse, upgradeProperty, players, currentPlayerIndex, getPropertyGroup, circuitCompleted } =
    useGameStore()
  const [isOpen, setIsOpen] = useState(true)
  const [activeTab, setActiveTab] = useState("buy")
  const [selectedLevel, setSelectedLevel] = useState(1)

  const currentPlayer = players[currentPlayerIndex]
  const canAfford = currentPlayer.money >= (property.price || 0)
  const hasCompletedCircuit = circuitCompleted[currentPlayerIndex]

  // Funkcja pomocnicza do obliczania ceny ulepszenia
  function getUpgradePrice(color: string, level: number): number {
    // Cena ulepszenia zależy od grupy kolorystycznej i poziomu
    const basePrices = {
      "#8B4513": 50, // Brązowe
      "#87CEEB": 50, // Jasnoniebieskie
      "#FF69B4": 100, // Różowe
      "#FFA500": 100, // Pomarańczowe
      "#FF0000": 150, // Czerwone
      "#FFFF00": 150, // Żółte
      "#008000": 200, // Zielone
      "#000080": 200, // Granatowe
    }

    const basePrice = basePrices[color] || 100

    // Mnożniki ceny dla różnych poziomów
    const levelMultipliers = [1, 1.5, 2, 3] // Poziom 1, 2, 3, hotel

    return Math.floor(basePrice * levelMultipliers[level - 1])
  }

  // Oblicz całkowitą cenę zakupu z ulepszeniem
  const getTotalPurchasePrice = () => {
    if (!property.price || !property.color) return 0

    const propertyPrice = property.price
    let upgradePrice = 0

    if (selectedLevel > 1) {
      // Dodaj cenę ulepszeń od poziomu 1 do wybranego poziomu
      for (let i = 1; i < selectedLevel; i++) {
        upgradePrice += getUpgradePrice(property.color, i + 1)
      }
    }

    return propertyPrice + upgradePrice
  }

  // Sprawdź, czy gracz może kupić nieruchomość z wybranym poziomem
  const canBuyWithLevel = () => {
    if (!canAfford || !property.color) return false

    // For level 1 and 2, no additional checks needed
    if (selectedLevel <= 2) {
      return currentPlayer.money >= getTotalPurchasePrice()
    }

    // For level 3, check if player has completed a circuit
    if (selectedLevel === 3) {
      if (!hasCompletedCircuit) return false
      return currentPlayer.money >= getTotalPurchasePrice()
    }

    return false
  }

  // Sprawdź, czy gracz może kupić hotel
  const canBuyHotel = () => {
    if (!property.ownerId || property.ownerId !== currentPlayer.id || !property.color) return false

    // Sprawdź, czy nieruchomość ma już poziom 3
    const currentLevel = property.level || 0
    if (currentLevel !== 3) return false

    // Sprawdź, czy gracz ma wystarczająco pieniędzy
    const hotelPrice = getUpgradePrice(property.color, 4) // 4 = hotel
    return currentPlayer.money >= hotelPrice
  }

  // Funkcja pomocnicza do wyświetlania nazwy poziomu ulepszenia
  function getLevelName(level: number): string {
    switch (level) {
      case 1:
        return "Poziom 1 (jeden domek)"
      case 2:
        return "Poziom 2 (dwa domki)"
      case 3:
        return "Poziom 3 (trzy domki)"
      case 4:
        return "Hotel"
      default:
        return "Brak ulepszeń"
    }
  }

  const handleBuy = () => {
    if (canBuyWithLevel() && property.id) {
      // Kup nieruchomość
      buyProperty(currentPlayerIndex, property.id, selectedLevel)
      handleClose()
    }
  }

  const handleBuyHotel = () => {
    if (canBuyHotel() && property.id) {
      upgradeProperty(currentPlayerIndex, property.id)
      handleClose()
    }
  }

  const handleClose = () => {
    setIsOpen(false)
    onClose()
  }

  // Oblicz aktualny czynsz
  const getCurrentRent = () => {
    if (!property.rent) return 0

    const currentLevel = property.level || 0
    if (currentLevel === 0) return property.rent

    // Mnożniki czynszu dla różnych poziomów
    const rentMultipliers = [1, 2, 3, 5] // Poziom 0, 1, 2, 3, hotel
    return property.rent * rentMultipliers[currentLevel]
  }

  // Oblicz czynsz dla wybranego poziomu
  const getRentForLevel = (level: number) => {
    if (!property.rent) return 0

    // Mnożniki czynszu dla różnych poziomów
    const rentMultipliers = [1, 2, 3, 5] // Poziom 0, 1, 2, 3, hotel
    return property.rent * rentMultipliers[level]
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nieruchomość: {property.name}</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <div className="w-full h-16 mb-4 rounded-md" style={{ backgroundColor: property.color }} />

          {property.ownerId === undefined ? (
            // Nieruchomość nie jest jeszcze kupiona
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Cena nieruchomości:</span>
                  <span className="font-bold">{property.price}$</span>
                </div>

                <div className="flex justify-between">
                  <span>Podstawowy czynsz:</span>
                  <span className="font-bold">{property.rent}$</span>
                </div>

                <div className="flex justify-between">
                  <span>Twoje pieniądze:</span>
                  <span className="font-bold">{currentPlayer.money}$</span>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Wybierz poziom ulepszenia:</h3>

                <RadioGroup
                  value={selectedLevel.toString()}
                  onValueChange={(value) => setSelectedLevel(Number.parseInt(value))}
                  className="space-y-3"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="1" id="level-1" />
                    <Label htmlFor="level-1" className="flex-1">
                      Poziom 1 (jeden domek)
                    </Label>
                    <span className="text-right">Czynsz: {getRentForLevel(1)}$</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="2" id="level-2" />
                    <Label htmlFor="level-2" className="flex-1">
                      Poziom 2 (dwa domki)
                    </Label>
                    <span className="text-right">Czynsz: {getRentForLevel(2)}$</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="3" id="level-3" disabled={!hasCompletedCircuit} />
                    <Label htmlFor="level-3" className={`flex-1 ${!hasCompletedCircuit ? "text-gray-400" : ""}`}>
                      Poziom 3 (trzy domki)
                      {!hasCompletedCircuit && (
                        <span className="block text-xs text-amber-500">Wymaga przejścia przez Start</span>
                      )}
                    </Label>
                    <span className={`text-right ${!hasCompletedCircuit ? "text-gray-400" : ""}`}>
                      Czynsz: {getRentForLevel(3)}$
                    </span>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2 pt-2 border-t">
                <div className="flex justify-between font-medium">
                  <span>Całkowity koszt:</span>
                  <span>{getTotalPurchasePrice()}$</span>
                </div>

                {!canBuyWithLevel() && (
                  <p className="text-red-500 text-sm">
                    {!canAfford
                      ? "Nie masz wystarczająco pieniędzy!"
                      : selectedLevel === 3 && !hasCompletedCircuit
                        ? "Musisz przejść przez Start, aby kupić poziom 3!"
                        : "Nie możesz kupić tej nieruchomości z wybranym poziomem!"}
                  </p>
                )}
              </div>

              <Button
                onClick={handleBuy}
                disabled={!canBuyWithLevel()}
                className="w-full bg-emerald-600 hover:bg-emerald-700"
              >
                Kup za {getTotalPurchasePrice()}$
              </Button>
            </div>
          ) : property.ownerId === currentPlayer.id && property.level === 3 ? (
            // Nieruchomość jest własnością gracza i ma poziom 3 - możliwość zakupu hotelu
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Obecny poziom:</span>
                  <span className="font-bold">{getLevelName(property.level)}</span>
                </div>

                <div className="flex justify-between">
                  <span>Aktualny czynsz:</span>
                  <span className="font-bold">{getCurrentRent()}$</span>
                </div>

                <div className="flex justify-between">
                  <span>Cena hotelu:</span>
                  <span className="font-bold">{getUpgradePrice(property.color, 4)}$</span>
                </div>

                <div className="flex justify-between">
                  <span>Czynsz z hotelem:</span>
                  <span className="font-bold">{getRentForLevel(4)}$</span>
                </div>

                <div className="flex justify-between">
                  <span>Twoje pieniądze:</span>
                  <span className="font-bold">{currentPlayer.money}$</span>
                </div>
              </div>

              <Button
                onClick={handleBuyHotel}
                disabled={!canBuyHotel()}
                className="w-full bg-emerald-600 hover:bg-emerald-700"
              >
                Kup hotel za {getUpgradePrice(property.color, 4)}$
              </Button>
            </div>
          ) : (
            // Nieruchomość jest już kupiona przez kogoś innego lub przez gracza (ale nie ma poziomu 3)
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Właściciel:</span>
                  <span className="font-bold" style={{ color: players.find((p) => p.id === property.ownerId)?.color }}>
                    {players.find((p) => p.id === property.ownerId)?.name}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span>Obecny poziom:</span>
                  <span className="font-bold">{getLevelName(property.level || 0)}</span>
                </div>

                <div className="flex justify-between">
                  <span>Aktualny czynsz:</span>
                  <span className="font-bold">{getCurrentRent()}$</span>
                </div>
              </div>

              <p className="text-center text-gray-500">
                {property.ownerId === currentPlayer.id
                  ? property.level === 4
                    ? "Ta nieruchomość ma już maksymalny poziom (hotel)!"
                    : "Ta nieruchomość jest już Twoja. Możesz ją ulepszyć w przyszłości."
                  : "Ta nieruchomość należy do innego gracza."}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Zamknij
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
