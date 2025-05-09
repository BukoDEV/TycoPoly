export interface Field {
  id: number
  name: string
  type: "property" | "chance" | "community" | "tax" | "jail" | "go-to-jail" | "start" | "parking"
  price?: number
  color?: string
  rent?: number
  ownerId?: number
  level?: number // Zamiast houses - poziom ulepszenia (0-3, 4=hotel)
}

export interface Player {
  id: number
  name: string
  color: string
  money: number
  position: number
  properties: number[]
  inJail: boolean
  isAI?: boolean
}

export interface ChanceCard {
  id: number
  text: string
  action: "move" | "money" | "jail" | "repairs"
  value: number
}

export type GameMode = "offline" | "online"
