"use client"

import { useCallback } from "react"
import type { Field } from "@/types/game-types"
import { useGameStore } from "@/store/game-store"

// Eksportujemy hook useAIPlayer
export const useAIPlayer = () => {
  const { board, players, currentPlayerIndex, movePlayer, endTurn, doublesCount } = useGameStore()

  // Funkcja sprzedająca nieruchomości AI, aby zdobyć pieniądze
  const sellPropertiesToRaiseMoney = useCallback(
    (targetAmount: number) => {
      const player = players[currentPlayerIndex]

      if (player.money >= targetAmount) return // Już ma wystarczająco pieniędzy

      // Pobierz nieruchomości gracza
      const playerProperties = player.properties
        .map((propId) => board.find((field) => field.id === propId))
        .filter(Boolean)

      if (playerProperties.length === 0) return // Nie ma nieruchomości do sprzedania

      // Sortuj nieruchomości według wartości (najpierw sprzedajemy najmniej wartościowe)
      const sortedProperties = [...playerProperties].sort((a, b) => {
        // Najpierw sprzedajemy nieruchomości bez domów
        if ((a.level || 0) > 0 && (b.level || 0) === 0) return 1
        if ((a.level || 0) === 0 && (b.level || 0) > 0) return -1

        // Następnie sortujemy według ceny
        return (a.price || 0) - (b.price || 0)
      })

      // Sprzedawaj nieruchomości, aż zdobędziemy wystarczająco pieniędzy
      for (const property of sortedProperties) {
        // Oblicz cenę sprzedaży (połowa ceny zakupu + połowa wartości domów)
        let sellPrice = Math.floor((property.price || 0) / 2)

        // Dodaj wartość ulepszeń
        if (property.level) {
          const upgradePrice = getHousePrice(property.color)
          sellPrice += Math.floor((upgradePrice * property.level) / 2)
        }

        // Sprzedaj nieruchomość
        players[currentPlayerIndex].money += sellPrice
        players[currentPlayerIndex].properties = players[currentPlayerIndex].properties.filter(
          (id) => id !== property.id,
        )

        // Zresetuj właściciela i domy
        property.ownerId = undefined
        property.level = 0

        console.log(`AI ${players[currentPlayerIndex].name} sprzedaje nieruchomość ${property.name} za ${sellPrice}$`)

        // Sprawdź, czy mamy już wystarczająco pieniędzy
        if (players[currentPlayerIndex].money >= targetAmount) break
      }
    },
    [board, players, currentPlayerIndex],
  )

  const decideIfShouldBuy = useCallback(
    (field: Field): boolean => {
      const player = players[currentPlayerIndex]

      // Jeśli nie ma ceny lub gracz nie ma pieniędzy, nie kupuj
      if (!field.price || player.money < field.price) {
        return false
      }

      // Bardziej ostrożna strategia AI:

      // 1. Zawsze zachowaj minimum 300$ rezerwy
      if (player.money - field.price < 300) {
        return false
      }

      // 2. Tanie nieruchomości (poniżej 150$) kupuj z większym prawdopodobieństwem
      if (field.price < 150) {
        return Math.random() < 0.7
      }

      // 3. Sprawdź, czy masz już nieruchomości w tym kolorze
      const sameColorProperties = board.filter(
        (f) =>
          f.type === "property" && f.color === field.color && players[currentPlayerIndex].properties.includes(f.id),
      )

      // Jeśli masz już nieruchomości w tym kolorze, zwiększ szansę na zakup
      if (sameColorProperties.length > 0) {
        // Im więcej nieruchomości w tym kolorze, tym większa szansa na zakup
        const buyProbability = 0.4 + sameColorProperties.length * 0.2
        return Math.random() < buyProbability
      }

      // 4. Podstawowa szansa na zakup zależna od ceny
      // Im droższa nieruchomość, tym mniejsza szansa na zakup
      const priceFactor = 1 - field.price / 400 // Maksymalna cena to 400
      return Math.random() < priceFactor * 0.4 // Zmniejszamy ogólne prawdopodobieństwo zakupu
    },
    [board, players, currentPlayerIndex],
  )

  // Funkcja kupująca nieruchomość dla AI
  const buyProperty = useCallback(
    (propertyId: number) => {
      const player = players[currentPlayerIndex]
      const property = board.find((field) => field.id === propertyId)

      if (!property || property.type !== "property" || property.ownerId !== undefined || !property.price) {
        return
      }

      // Sprawdź, czy gracz ma wystarczająco pieniędzy
      if (player.money < property.price) {
        return
      }

      // Kup nieruchomość
      players[currentPlayerIndex].money -= property.price
      players[currentPlayerIndex].properties.push(propertyId)
      property.ownerId = player.id
      property.level = 0

      console.log(`AI ${player.name} kupuje nieruchomość: ${property.name} za ${property.price}$`)
    },
    [board, players, currentPlayerIndex],
  )

  // Funkcja kupująca dom dla AI
  const buyHouse = useCallback(
    (propertyId: number) => {
      const player = players[currentPlayerIndex]
      const property = board.find((field) => field.id === propertyId)

      if (!property || property.type !== "property" || property.ownerId !== player.id) {
        return
      }

      // Sprawdź, czy nieruchomość ma już maksymalną liczbę domów (5 = hotel)
      if (property.level >= 4) return

      // Oblicz cenę domu
      const housePrice = getHousePrice(property.color)

      // Sprawdź, czy gracz ma wystarczająco pieniędzy
      if (player.money < housePrice) {
        return
      }

      // Kup dom
      players[currentPlayerIndex].money -= housePrice
      property.level = (property.level || 0) + 1

      console.log(
        `AI ${player.name} kupuje ${property.level === 4 ? "hotel" : "dom"} na nieruchomości: ${property.name} za ${housePrice}$`,
      )
    },
    [board, players, currentPlayerIndex],
  )

  const processAITurn = useCallback(() => {
    const player = players[currentPlayerIndex]
    const currentField = board.find((field) => field.id === player.position)

    if (currentField?.type === "property" && !currentField.ownerId) {
      if (decideIfShouldBuy(currentField)) {
        buyProperty(currentField.id)
      }
    }

    // Nie kończymy tury tutaj, ponieważ to jest obsługiwane w game-container.tsx
  }, [board, players, currentPlayerIndex, decideIfShouldBuy, buyProperty])

  return {
    processAITurn,
    sellPropertiesToRaiseMoney,
    buyProperty,
    buyHouse,
    decideIfShouldBuy,
  }
}

// Funkcja pomocnicza do obliczania ceny domu
function getHousePrice(color: string): number {
  // Cena domu zależy od grupy kolorystycznej
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

// Dla kompatybilności wstecznej, eksportujemy również funkcję runAITurn
export function runAITurn(
  playerIndex: number,
  players: any[],
  board: any[],
  movePlayer: (playerIndex: number, steps: number, isDoubles: boolean) => void,
  endTurn: () => void,
  doublesCount: number,
) {
  return new Promise<boolean>((resolve) => {
    const player = players[playerIndex]

    if (!player || !player.isAI) {
      console.log("This is not an AI turn")
      resolve(false)
      return
    }

    // Generate random dice values
    const dice1 = Math.floor(Math.random() * 6) + 1
    const dice2 = Math.floor(Math.random() * 6) + 1
    const isDoubles = dice1 === dice2

    console.log(`AI rolling dice: ${dice1} + ${dice2} = ${dice1 + dice2}${isDoubles ? " (doubles)" : ""}`)

    // Emit AI dice roll event with values
    const aiRollEvent = new CustomEvent("ai-dice-roll", {
      detail: { dice1, dice2 },
    })
    window.dispatchEvent(aiRollEvent)

    // Wait for roll animation to complete (4 seconds)
    setTimeout(() => {
      // Execute AI move
      movePlayer(playerIndex, dice1 + dice2, isDoubles)

      // Resolve promise with info whether AI should roll again (in case of doubles)
      resolve(isDoubles && doublesCount < 2)
    }, 4000)
  })
}
