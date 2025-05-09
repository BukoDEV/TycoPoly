"use client"

import { useRef } from "react"
import { Text } from "@react-three/drei"
import { Building } from "./building-models"
import { SpecialFieldMarker } from "./special-field-marker"
import type { Field } from "@/types/game-types"

interface BoardFieldProps {
  field: Field
  position: number
  players: any[]
}

export default function BoardField({ field, position, players }: BoardFieldProps) {
  const ref = useRef()

  // Określenie pozycji pola na planszy 3D
  const getFieldPosition = () => {
    const boardSize = 12 // Rozmiar planszy
    const fieldSize = 1.2 // Rozmiar pola
    const side = Math.floor(position / 10)
    const posInSide = position % 10

    // Górna strona (0-10)
    if (side === 0) {
      return [boardSize / 2 - fieldSize * posInSide, 0, -boardSize / 2]
    }
    // Lewa strona (11-20)
    else if (side === 1) {
      return [-boardSize / 2, 0, -boardSize / 2 + fieldSize * posInSide]
    }
    // Dolna strona (21-30)
    else if (side === 2) {
      return [-boardSize / 2 + fieldSize * posInSide, 0, boardSize / 2]
    }
    // Prawa strona (31-39)
    else {
      return [boardSize / 2, 0, boardSize / 2 - fieldSize * posInSide]
    }
  }

  const [x, y, z] = getFieldPosition()

  // Określenie rotacji pola (aby tekst był skierowany do środka planszy)
  const getFieldRotation = () => {
    const side = Math.floor(position / 10)

    // Górna strona (0-10)
    if (side === 0) {
      return [0, 0, 0]
    }
    // Lewa strona (11-20)
    else if (side === 1) {
      return [0, Math.PI / 2, 0]
    }
    // Dolna strona (21-30)
    else if (side === 2) {
      return [0, Math.PI, 0]
    }
    // Prawa strona (31-39)
    else {
      return [0, -Math.PI / 2, 0]
    }
  }

  const [rotX, rotY, rotZ] = getFieldRotation()

  // Określenie koloru pola w zależności od typu
  const getFieldColor = () => {
    if (field.type === "property") {
      return field.color || "#cccccc"
    } else if (field.type === "chance") {
      return "#FFA500"
    } else if (field.type === "community") {
      return "#3b82f6"
    } else if (field.type === "tax") {
      return "#ef4444"
    } else if (field.type === "jail" || field.type === "go-to-jail") {
      return "#6b7280"
    } else if (field.type === "start") {
      return "#22c55e"
    } else if (field.type === "parking") {
      return "#f59e0b"
    }
    return "#cccccc"
  }

  // Znajdź gracza, który jest właścicielem pola
  const getOwnerColor = () => {
    if (field.ownerId && players) {
      const owner = players.find((p) => p.id === field.ownerId)
      return owner ? owner.color : null
    }
    return null
  }

  const ownerColor = getOwnerColor()

  return (
    <group position={[x, y, z]} rotation={[0, rotY, 0]} ref={ref}>
      {/* Pole */}
      <mesh receiveShadow position={[0, 0, 0]}>
        <boxGeometry args={[1.2, 0.1, 1.2]} />
        <meshStandardMaterial color="#e5e5e5" />
      </mesh>

      {/* Kolorowy pasek (dla nieruchomości) */}
      {field.type === "property" && (
        <mesh receiveShadow position={[0, 0.06, -0.4]}>
          <boxGeometry args={[1.1, 0.05, 0.3]} />
          <meshStandardMaterial color={getFieldColor()} />
        </mesh>
      )}

      {/* Oznaczenie właściciela (dla kupionych nieruchomości) */}
      {field.type === "property" && ownerColor && (
        <mesh receiveShadow position={[0, 0.1, 0.4]}>
          <boxGeometry args={[0.8, 0.05, 0.2]} />
          <meshStandardMaterial color={ownerColor} />
        </mesh>
      )}

      {/* Specjalne oznaczenia dla pól specjalnych */}
      {(field.type === "start" || field.type === "jail" || field.type === "go-to-jail" || field.type === "parking") && (
        <SpecialFieldMarker type={field.type} position={[0, 0.15, 0]} rotation={[0, -rotY, 0]} />
      )}

      {/* Nazwa pola */}
      <Text
        position={[0, 0.1, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.12}
        maxWidth={1}
        textAlign="center"
        color="#000000"
      >
        {field.name}
      </Text>

      {/* Cena (dla nieruchomości) */}
      {field.type === "property" && field.price && (
        <Text position={[0, 0.1, 0.3]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.1} color="#000000">
          {field.price}$
        </Text>
      )}

      {/* Czynsz (dla nieruchomości) */}
      {field.type === "property" && field.rent && (
        <Text position={[0, 0.1, 0.15]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.08} color="#ef4444">
          Czynsz: {field.rent}$
        </Text>
      )}

      {/* Budynki (poziomy ulepszeń) */}
      {field.type === "property" && field.level !== undefined && field.level > 0 && (
        <BuildingsGroup level={field.level} fieldRotation={rotY} />
      )}
    </group>
  )
}

// Komponent renderujący grupę budynków (domki lub hotel)
function BuildingsGroup({ level, fieldRotation }) {
  // Pozycje budynków na polu
  const getBuildingPositions = () => {
    if (level === 4) {
      // Hotel (centralnie)
      return [[0, 0, "hotel"]]
    } else {
      // Domki (rozmieszczone równomiernie)
      const positions = []
      const spacing = 0.2
      const startX = -((level - 1) * spacing) / 2

      for (let i = 0; i < level; i++) {
        positions.push([startX + i * spacing, 0, "house"])
      }

      return positions
    }
  }

  const positions = getBuildingPositions()

  return (
    <group position={[0, 0.1, 0]}>
      {positions.map((pos, index) => (
        <Building key={index} position={[pos[0], 0, 0.1]} rotation={[0, fieldRotation, 0]} type={pos[2]} />
      ))}
    </group>
  )
}
