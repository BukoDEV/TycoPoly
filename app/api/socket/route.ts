import { Server } from "socket.io"
import { NextResponse } from "next/server"

// Przechowywanie pokojów gry
const gameRooms = new Map()

export async function POST(req: Request) {
  const { server } = req as any

  if (!server.socket) {
    const io = new Server(server, {
      cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
      },
    })

    server.socket = io

    io.on("connection", (socket) => {
      console.log("Client connected:", socket.id)

      // Tworzenie lub dołączanie do pokoju
      socket.on("createRoom", ({ playerName }) => {
        const roomId = generateRoomId()

        const player = {
          id: 1,
          name: playerName,
          color: "#ef4444",
          money: 1500,
          position: 0,
          properties: [],
          inJail: false,
          isAI: false,
          socketId: socket.id,
        }

        gameRooms.set(roomId, {
          players: [player],
          currentPlayerIndex: 0,
          board: [], // Plansza zostanie zainicjalizowana przez klienta
        })

        socket.join(roomId)
        socket.emit("joinedRoom", { roomId, players: [player] })
      })

      // Dołączanie do istniejącego pokoju
      socket.on("joinRoom", ({ roomId, playerName }) => {
        const room = gameRooms.get(roomId)

        if (!room) {
          socket.emit("error", { message: "Pokój nie istnieje" })
          return
        }

        if (room.players.length >= 4) {
          socket.emit("error", { message: "Pokój jest pełny" })
          return
        }

        const playerId = room.players.length + 1
        const colors = ["#ef4444", "#3b82f6", "#22c55e", "#f59e0b"]

        const player = {
          id: playerId,
          name: playerName,
          color: colors[playerId - 1],
          money: 1500,
          position: 0,
          properties: [],
          inJail: false,
          isAI: false,
          socketId: socket.id,
        }

        room.players.push(player)

        socket.join(roomId)
        socket.emit("joinedRoom", { roomId, players: room.players })

        // Powiadom innych graczy o nowym graczu
        socket.to(roomId).emit("playerJoined", { player })
        socket.to(roomId).emit("gameState", { players: room.players })
      })

      // Rzut kostkami
      socket.on("rollDice", ({ roomId, diceSum }) => {
        const room = gameRooms.get(roomId)

        if (!room) return

        const currentPlayer = room.players[room.currentPlayerIndex]

        // Sprawdź, czy to ruch tego gracza
        if (currentPlayer.socketId !== socket.id) return

        // Wykonaj ruch
        const newPosition = (currentPlayer.position + diceSum) % 40

        // Jeśli gracz przeszedł przez Start, dodaj 200$
        if (newPosition < currentPlayer.position) {
          currentPlayer.money += 200
        }

        currentPlayer.position = newPosition

        // Powiadom wszystkich graczy o zmianie stanu
        io.to(roomId).emit("gameState", { players: room.players })
      })

      // Zakończenie tury
      socket.on("endTurn", ({ roomId }) => {
        const room = gameRooms.get(roomId)

        if (!room) return

        const currentPlayer = room.players[room.currentPlayerIndex]

        // Sprawdź, czy to ruch tego gracza
        if (currentPlayer.socketId !== socket.id) return

        // Przejdź do następnego gracza
        room.currentPlayerIndex = (room.currentPlayerIndex + 1) % room.players.length

        // Powiadom wszystkich graczy o zmianie stanu
        io.to(roomId).emit("gameState", {
          players: room.players,
          currentPlayerIndex: room.currentPlayerIndex,
        })
      })

      // Kupowanie nieruchomości
      socket.on("buyProperty", ({ roomId, propertyId }) => {
        const room = gameRooms.get(roomId)

        if (!room) return

        const currentPlayer = room.players[room.currentPlayerIndex]

        // Sprawdź, czy to ruch tego gracza
        if (currentPlayer.socketId !== socket.id) return

        // Logika kupowania nieruchomości
        // (Uproszczona - w pełnej implementacji trzeba by przesłać całą planszę)
        currentPlayer.properties.push(propertyId)

        // Powiadom wszystkich graczy o zmianie stanu
        io.to(roomId).emit("gameState", { players: room.players })
      })

      // Obsługa rozłączenia
      socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id)

        // Znajdź i usuń gracza ze wszystkich pokojów
        for (const [roomId, room] of gameRooms.entries()) {
          const playerIndex = room.players.findIndex((p) => p.socketId === socket.id)

          if (playerIndex !== -1) {
            room.players.splice(playerIndex, 1)

            // Jeśli pokój jest pusty, usuń go
            if (room.players.length === 0) {
              gameRooms.delete(roomId)
            } else {
              // Powiadom pozostałych graczy
              io.to(roomId).emit("playerLeft", { playerId: playerIndex + 1 })
              io.to(roomId).emit("gameState", { players: room.players })
            }
          }
        }
      })
    })
  }

  return NextResponse.json({ success: true })
}

// Generowanie losowego ID pokoju
function generateRoomId() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let result = ""
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}
