"use client"

import { create } from "zustand"
import type { Field, Player, GameMode } from "@/types/game-types"

// Add canRollDice state to control when dice can be rolled
// Fix property purchase issues
// Rename game to TycoPoly

// First, add canRollDice to the interface
interface GameState {
  board: Field[]
  players: Player[]
  currentPlayerIndex: number
  gameStarted: boolean
  gameMode: GameMode
  doublesCount: number
  rentMessage: string | null
  showSellPropertyModal: boolean
  debtInfo: { amount: number; toPlayerId: number } | null
  // Stany
  circuitCompleted: boolean[] // Tablica przechowująca informację, czy gracz ukończył pełne okrążenie
  jailTurns: number[] // Tablica przechowująca liczbę tur w więzieniu dla każdego gracza
  canRollDice: boolean // Czy można rzucić kostkami
  isRolling: boolean // Czy kostki są w trakcie rzutu

  initializeGame: (board: Field[], players: Player[]) => void
  movePlayer: (playerIndex: number, steps: number, isDoubles: boolean) => void
  buyProperty: (playerIndex: number, propertyId: number, level?: number) => void
  sellProperty: (playerIndex: number, propertyId: number) => void
  buyHouse: (playerIndex: number, propertyId: number) => void
  endTurn: () => void
  isAITurn: () => boolean
  setGameStarted: (started: boolean) => void
  setGameMode: (mode: GameMode) => void
  setPlayers: (players: Player[]) => void
  getPropertyGroup: (color: string) => Field[]
  resetDoublesCount: () => void
  sendToJail: (playerIndex: number) => void
  clearRentMessage: () => void
  setShowSellPropertyModal: (show: boolean) => void
  payDebt: () => void
  setIsRolling: (isRolling: boolean) => void
  // Metody
  payJailFee: (playerIndex: number) => void // Metoda do zapłacenia kaucji za wyjście z więzienia
  upgradeProperty: (playerIndex: number, propertyId: number) => void // Metoda do ulepszenia nieruchomości do hotelu
}

// Then add the initial state for canRollDice and isRolling
export const useGameStore = create<GameState>((set, get) => ({
  board: [],
  players: [],
  currentPlayerIndex: 0,
  gameStarted: false,
  gameMode: "offline",
  doublesCount: 0,
  rentMessage: null,
  showSellPropertyModal: false,
  debtInfo: null,
  circuitCompleted: [], // Inicjalizacja tablicy ukończonych okrążeń
  jailTurns: [], // Inicjalizacja tablicy tur w więzieniu
  canRollDice: true, // Początkowo można rzucić kostkami
  isRolling: false, // Początkowo kostki nie są w trakcie rzutu

  // Add setIsRolling method
  setIsRolling: (isRolling) => set({ isRolling }),

  // Update initializeGame to set canRollDice to true
  initializeGame: (board, players) =>
    set({
      board,
      players,
      circuitCompleted: Array(players.length).fill(false),
      jailTurns: Array(players.length).fill(0),
      canRollDice: true,
    }),

  // Update movePlayer to set canRollDice based on doubles
  movePlayer: (playerIndex, steps, isDoubles) =>
    set((state) => {
      const newPlayers = [...state.players]
      const player = newPlayers[playerIndex]
      const newJailTurns = [...state.jailTurns]

      // Aktualizuj licznik dubletów
      const newDoublesCount = isDoubles ? state.doublesCount + 1 : 0

      // Sprawdź, czy gracz jest w więzieniu
      if (player.inJail) {
        // Jeśli wyrzucił dublet, wychodzi z więzienia
        if (isDoubles) {
          player.inJail = false
          newJailTurns[playerIndex] = 0
          // Wykonaj normalny ruch
        } else {
          // Zwiększ licznik tur w więzieniu
          newJailTurns[playerIndex]++

          // Jeśli to trzecia tura w więzieniu, gracz musi zapłacić 200$ i wyjść
          if (newJailTurns[playerIndex] >= 3) {
            if (player.money >= 200) {
              player.money -= 200
              player.inJail = false
              newJailTurns[playerIndex] = 0
              // Wykonaj normalny ruch
            } else {
              // Gracz nie ma pieniędzy, musi sprzedać nieruchomości
              return {
                players: newPlayers,
                jailTurns: newJailTurns,
                rentMessage: `${player.name} nie ma wystarczająco pieniędzy, aby zapłacić za wyjście z więzienia!`,
                showSellPropertyModal: true,
                debtInfo: { amount: 200, toPlayerId: 0 }, // 0 oznacza płatność do banku
                canRollDice: false,
              }
            }
          } else {
            // Gracz zostaje w więzieniu
            return {
              players: newPlayers,
              jailTurns: newJailTurns,
              rentMessage: `${player.name} zostaje w więzieniu (tura ${newJailTurns[playerIndex]}/3)`,
              canRollDice: false,
            }
          }
        }
      }

      // Sprawdź, czy to trzeci dublet z rzędu - idź do więzienia
      if (newDoublesCount >= 3) {
        // Znajdź pole więzienia (id 10)
        player.position = 10
        player.inJail = true
        newJailTurns[playerIndex] = 0
        return {
          players: newPlayers,
          doublesCount: 0,
          jailTurns: newJailTurns,
          rentMessage: "Trzeci dublet z rzędu! Idziesz do więzienia!",
          canRollDice: false,
        }
      }

      // Oblicz nową pozycję (z przejściem przez Start)
      const newPosition = (player.position + steps) % 40

      // Jeśli gracz przeszedł przez Start, dodaj 300$ (zamiast 200$)
      if (newPosition < player.position) {
        player.money += 300

        // Oznacz, że gracz ukończył pełne okrążenie
        const newCircuitCompleted = [...state.circuitCompleted]
        newCircuitCompleted[playerIndex] = true
        set({ circuitCompleted: newCircuitCompleted })

        return {
          players: newPlayers,
          doublesCount: newDoublesCount,
          rentMessage: `${player.name} przechodzi przez Start i otrzymuje 300$!`,
          canRollDice: isDoubles, // Można rzucić ponownie tylko jeśli był dublet
        }
      }

      player.position = newPosition

      // Sprawdź, czy gracz wylądował na polu "Idź do więzienia"
      if (state.board[newPosition].type === "go-to-jail") {
        player.position = 10 // Pole więzienia
        player.inJail = true
        newJailTurns[playerIndex] = 0
        return {
          players: newPlayers,
          doublesCount: 0,
          jailTurns: newJailTurns,
          rentMessage: "Wylądowałeś na polu 'Idź do więzienia'!",
          canRollDice: false,
        }
      }

      // Sprawdź, czy gracz wylądował na polu innego gracza i musi zapłacić czynsz
      const field = state.board[newPosition]
      if (field.type === "property" && field.ownerId !== undefined && field.ownerId !== player.id) {
        const owner = newPlayers.find((p) => p.id === field.ownerId)
        if (owner) {
          // Oblicz czynsz (uwzględnij poziom ulepszenia)
          let rentAmount = field.rent || 0
          if (field.level) {
            // Zwiększ czynsz w zależności od poziomu ulepszenia
            const levelMultiplier = [1, 2, 3, 5] // Poziom 0, 1, 2, 3 (hotel)
            rentAmount = Math.floor(rentAmount * levelMultiplier[field.level])
          }

          // Sprawdź, czy gracz ma wystarczająco pieniędzy
          if (player.money >= rentAmount) {
            // Zapłać czynsz
            player.money -= rentAmount
            owner.money += rentAmount

            return {
              players: newPlayers,
              doublesCount: newDoublesCount,
              jailTurns: newJailTurns,
              rentMessage: `${player.name} płaci ${rentAmount}$ czynszu dla ${owner.name} za pole ${field.name}`,
              canRollDice: isDoubles, // Można rzucić ponownie tylko jeśli był dublet
            }
          } else {
            // Gracz nie ma wystarczająco pieniędzy - musi sprzedać nieruchomości
            return {
              players: newPlayers,
              doublesCount: newDoublesCount,
              jailTurns: newJailTurns,
              rentMessage: `${player.name} nie ma wystarczająco pieniędzy, aby zapłacić czynsz!`,
              showSellPropertyModal: true,
              debtInfo: { amount: rentAmount, toPlayerId: owner.id },
              canRollDice: false,
            }
          }
        }
      }

      return {
        players: newPlayers,
        doublesCount: newDoublesCount,
        jailTurns: newJailTurns,
        canRollDice: isDoubles, // Można rzucić ponownie tylko jeśli był dublet
      }
    }),

  // Fix the buyProperty method to properly handle level purchases
  buyProperty: (playerIndex, propertyId, level = 0) =>
    set((state) => {
      const newPlayers = [...state.players]
      const player = newPlayers[playerIndex]
      const newBoard = [...state.board]

      // Znajdź nieruchomość
      const propertyIndex = newBoard.findIndex((field) => field.id === propertyId)
      if (propertyIndex === -1) return state

      const property = newBoard[propertyIndex]
      if (property.type !== "property" || property.ownerId !== undefined || !property.price) {
        return state
      }

      // Oblicz całkowitą cenę zakupu z ulepszeniami
      let totalPrice = property.price

      // Jeśli wybrano poziom wyższy niż 0, dodaj koszty ulepszeń
      if (level > 0 && property.color) {
        // Sprawdź, czy gracz może kupić poziom 3 (wymaga ukończenia okrążenia)
        if (level === 3 && !state.circuitCompleted[playerIndex]) {
          return {
            ...state,
            rentMessage: "Musisz ukończyć pełne okrążenie, aby kupić trzeci poziom ulepszenia!",
          }
        }

        // Dodaj koszt ulepszeń
        for (let i = 1; i <= level; i++) {
          totalPrice += getUpgradePrice(property.color, i)
        }
      }

      // Sprawdź, czy gracz ma wystarczająco pieniędzy
      if (player.money < totalPrice) {
        return {
          ...state,
          rentMessage: "Nie masz wystarczająco pieniędzy, aby kupić tę nieruchomość!",
        }
      }

      // Kup nieruchomość z wybranym poziomem
      player.money -= totalPrice
      player.properties.push(propertyId)
      newBoard[propertyIndex] = {
        ...property,
        ownerId: player.id,
        level: level, // Ustaw wybrany poziom
      }

      return {
        players: newPlayers,
        board: newBoard,
        rentMessage: `${player.name} kupił nieruchomość ${property.name} z poziomem ${level} za ${totalPrice}$`,
        canRollDice: false, // Po zakupie nie można już rzucać
      }
    }),

  sellProperty: (playerIndex, propertyId) =>
    set((state) => {
      const newPlayers = [...state.players]
      const player = newPlayers[playerIndex]
      const newBoard = [...state.board]

      // Znajdź nieruchomość
      const propertyIndex = newBoard.findIndex((field) => field.id === propertyId)
      if (propertyIndex === -1) return state

      const property = newBoard[propertyIndex]
      if (property.type !== "property" || property.ownerId !== player.id || !property.price) {
        return state
      }

      // Sprzedaj nieruchomość (za połowę ceny)
      const sellPrice = Math.floor(property.price / 2)
      player.money += sellPrice
      player.properties = player.properties.filter((id) => id !== propertyId)

      // Sprzedaj również wszystkie ulepszenia (za połowę ceny)
      if (property.level && property.color) {
        let upgradeSellPrice = 0
        for (let i = 1; i <= property.level; i++) {
          upgradeSellPrice += Math.floor(getUpgradePrice(property.color, i) / 2)
        }
        player.money += upgradeSellPrice
      }

      // Zresetuj właściciela i poziom ulepszenia
      newBoard[propertyIndex] = { ...property, ownerId: undefined, level: 0 }

      return {
        players: newPlayers,
        board: newBoard,
        rentMessage: `${player.name} sprzedał nieruchomość ${property.name} za ${sellPrice}$`,
      }
    }),

  buyHouse: (playerIndex, propertyId) =>
    set((state) => {
      const newPlayers = [...state.players]
      const player = newPlayers[playerIndex]
      const newBoard = [...state.board]

      // Znajdź nieruchomość
      const propertyIndex = newBoard.findIndex((field) => field.id === propertyId)
      if (propertyIndex === -1) return state

      const property = newBoard[propertyIndex]
      if (property.type !== "property" || property.ownerId !== player.id) {
        return state
      }

      // Sprawdź, czy gracz posiada wszystkie nieruchomości w grupie
      const propertiesInGroup = get().getPropertyGroup(property.color)
      const ownsAllInGroup = propertiesInGroup.every((prop) => prop.ownerId === player.id)
      if (!ownsAllInGroup) return state

      // Sprawdź, czy nieruchomość ma już maksymalny poziom ulepszenia
      const currentLevel = property.level || 0
      if (currentLevel >= 3) return state

      // Sprawdź, czy gracz ukończył pełne okrążenie (wymagane dla poziomu 3)
      if (currentLevel === 2 && !state.circuitCompleted[playerIndex]) {
        return {
          ...state,
          rentMessage: "Musisz ukończyć pełne okrążenie, aby kupić trzeci poziom ulepszenia!",
        }
      }

      // Oblicz cenę ulepszenia
      const upgradePrice = getUpgradePrice(property.color, currentLevel + 1)

      // Sprawdź, czy gracz ma wystarczająco pieniędzy
      if (player.money < upgradePrice) {
        return state
      }

      // Kup ulepszenie
      player.money -= upgradePrice
      newBoard[propertyIndex] = { ...property, level: currentLevel + 1 }

      return {
        players: newPlayers,
        board: newBoard,
        rentMessage: `${player.name} ulepsza nieruchomość ${property.name} do poziomu ${currentLevel + 1} za ${upgradePrice}$`,
      }
    }),

  // Metoda do ulepszenia nieruchomości do hotelu
  upgradeProperty: (playerIndex, propertyId) =>
    set((state) => {
      const newPlayers = [...state.players]
      const player = newPlayers[playerIndex]
      const newBoard = [...state.board]

      // Znajdź nieruchomość
      const propertyIndex = newBoard.findIndex((field) => field.id === propertyId)
      if (propertyIndex === -1) return state

      const property = newBoard[propertyIndex]
      if (property.type !== "property" || property.ownerId !== player.id) {
        return state
      }

      // Sprawdź, czy nieruchomość ma już poziom 3 (wymagany dla hotelu)
      const currentLevel = property.level || 0
      if (currentLevel !== 3) {
        return {
          ...state,
          rentMessage: "Musisz mieć 3 poziom ulepszenia, aby kupić hotel!",
        }
      }

      // Oblicz cenę hotelu
      const hotelPrice = getUpgradePrice(property.color, 4) // 4 = hotel

      // Sprawdź, czy gracz ma wystarczająco pieniędzy
      if (player.money < hotelPrice) {
        return state
      }

      // Kup hotel
      player.money -= hotelPrice
      newBoard[propertyIndex] = { ...property, level: 4 } // 4 = hotel

      return {
        players: newPlayers,
        board: newBoard,
        rentMessage: `${player.name} kupuje hotel na nieruchomości ${property.name} za ${hotelPrice}$`,
      }
    }),

  // Metoda do zapłacenia kaucji za wyjście z więzienia
  payJailFee: (playerIndex) =>
    set((state) => {
      const newPlayers = [...state.players]
      const player = newPlayers[playerIndex]
      const newJailTurns = [...state.jailTurns]

      // Sprawdź, czy gracz jest w więzieniu
      if (!player.inJail) {
        return state
      }

      // Sprawdź, czy gracz ma wystarczająco pieniędzy
      if (player.money < 200) {
        return {
          ...state,
          rentMessage: `${player.name} nie ma wystarczająco pieniędzy, aby zapłacić za wyjście z więzienia!`,
          showSellPropertyModal: true,
          debtInfo: { amount: 200, toPlayerId: 0 }, // 0 oznacza płatność do banku
        }
      }

      // Zapłać kaucję
      player.money -= 200
      player.inJail = false
      newJailTurns[playerIndex] = 0

      return {
        players: newPlayers,
        jailTurns: newJailTurns,
        rentMessage: `${player.name} płaci 200$ i wychodzi z więzienia!`,
      }
    }),

  // Update endTurn to reset canRollDice
  endTurn: () =>
    set((state) => ({
      currentPlayerIndex: (state.currentPlayerIndex + 1) % state.players.length,
      doublesCount: 0, // Resetuj licznik dubletów przy zmianie gracza
      rentMessage: null, // Wyczyść komunikat o czynszu przy zmianie gracza
      canRollDice: true, // Resetuj możliwość rzucania kostkami
    })),

  isAITurn: () => {
    const { players, currentPlayerIndex } = get()
    return players[currentPlayerIndex]?.isAI || false
  },

  setGameStarted: (started) => set({ gameStarted: started }),

  setGameMode: (mode) => set({ gameMode: mode }),

  setPlayers: (players) => set({ players }),

  getPropertyGroup: (color) => {
    const { board } = get()
    return board.filter((field) => field.type === "property" && field.color === color)
  },

  resetDoublesCount: () => set({ doublesCount: 0 }),

  sendToJail: (playerIndex) =>
    set((state) => {
      const newPlayers = [...state.players]
      const player = newPlayers[playerIndex]
      const newJailTurns = [...state.jailTurns]

      player.position = 10
      player.inJail = true
      newJailTurns[playerIndex] = 0

      return {
        players: newPlayers,
        doublesCount: 0,
        jailTurns: newJailTurns,
      }
    }),

  clearRentMessage: () => set({ rentMessage: null }),

  setShowSellPropertyModal: (show) => set({ showSellPropertyModal: show }),

  payDebt: () =>
    set((state) => {
      if (!state.debtInfo) return state

      const newPlayers = [...state.players]
      const player = newPlayers[state.currentPlayerIndex]

      // Jeśli dług jest do banku (toPlayerId = 0)
      if (state.debtInfo.toPlayerId === 0) {
        // Sprawdź, czy gracz ma teraz wystarczająco pieniędzy
        if (player.money >= state.debtInfo.amount) {
          // Zapłać dług
          player.money -= state.debtInfo.amount

          // Jeśli to była kaucja za wyjście z więzienia
          if (player.inJail) {
            player.inJail = false
            const newJailTurns = [...state.jailTurns]
            newJailTurns[state.currentPlayerIndex] = 0

            return {
              players: newPlayers,
              debtInfo: null,
              showSellPropertyModal: false,
              jailTurns: newJailTurns,
              rentMessage: `${player.name} zapłacił ${state.debtInfo.amount}$ i wyszedł z więzienia`,
            }
          }

          return {
            players: newPlayers,
            debtInfo: null,
            showSellPropertyModal: false,
            rentMessage: `${player.name} zapłacił ${state.debtInfo.amount}$ do banku`,
          }
        }
      } else {
        // Dług do innego gracza
        const creditor = newPlayers.find((p) => p.id === state.debtInfo.toPlayerId)
        if (!creditor) return state

        // Sprawdź, czy gracz ma teraz wystarczająco pieniędzy
        if (player.money >= state.debtInfo.amount) {
          // Zapłać dług
          player.money -= state.debtInfo.amount
          creditor.money += state.debtInfo.amount

          return {
            players: newPlayers,
            debtInfo: null,
            showSellPropertyModal: false,
            rentMessage: `${player.name} zapłacił ${state.debtInfo.amount}$ czynszu dla ${creditor.name}`,
          }
        }
      }

      // Gracz nadal nie ma wystarczająco pieniędzy
      return state
    }),
}))

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
