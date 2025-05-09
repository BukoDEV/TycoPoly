"use client"

import { useRef, useState, useEffect } from "react"
import { useFrame } from "@react-three/fiber"
import { Text } from "@react-three/drei"
import { useGameStore } from "@/store/game-store"

interface PlayerTokenProps {
  player: any
  isActive: boolean
}

export default function PlayerToken({ player, isActive }: PlayerTokenProps) {
  const ref = useRef()
  const { board } = useGameStore()

  // Stan do przechowywania aktualnej pozycji tokena
  const [currentPosition, setCurrentPosition] = useState(player.position)
  // Stan do przechowywania docelowej pozycji tokena
  const [targetPosition, setTargetPosition] = useState(player.position)
  // Stan do przechowywania pozycji pośrednich podczas animacji
  const [movePath, setMovePath] = useState<number[]>([])
  // Stan do przechowywania aktualnej pozycji w ścieżce ruchu
  const [pathIndex, setPathIndex] = useState(0)
  // Stan do przechowywania pozycji 3D tokena
  const [tokenPosition, setTokenPosition] = useState(() => getTokenPosition(player.position, player.id))
  // Referencja do czasu animacji
  const animationTimeRef = useRef(0)
  // Stan animacji
  const [isAnimating, setIsAnimating] = useState(false)
  // Referencja do poprzedniej pozycji gracza
  const prevPositionRef = useRef(player.position)

  // Efekt do obsługi zmiany pozycji gracza
  useEffect(() => {
    // Używamy setTimeout, aby uniknąć aktualizacji stanu podczas renderowania
    const timeoutId = setTimeout(() => {
      // Sprawdź, czy pozycja faktycznie się zmieniła
      if (player.position !== prevPositionRef.current) {
        console.log(`Player ${player.id} moving from ${prevPositionRef.current} to ${player.position}`)

        // Oblicz ścieżkę ruchu
        const path = calculateMovePath(prevPositionRef.current, player.position)
        console.log(`Movement path: ${path.join(", ")}`)

        setMovePath(path)
        setPathIndex(0)
        setTargetPosition(player.position)
        setIsAnimating(true)
        animationTimeRef.current = 0

        // Aktualizuj referencję do poprzedniej pozycji
        prevPositionRef.current = player.position
      }
    }, 0)

    return () => clearTimeout(timeoutId)
  }, [player.position])

  // Funkcja do obliczania ścieżki ruchu
  const calculateMovePath = (startPos: number, endPos: number) => {
    const path = []

    // Jeśli gracz przechodzi przez Start (pozycja końcowa jest mniejsza niż początkowa)
    if (endPos < startPos) {
      // Dodaj wszystkie pola od startPos+1 do 39
      for (let i = startPos + 1; i <= 39; i++) {
        path.push(i)
      }
      // Dodaj wszystkie pola od 0 do endPos
      for (let i = 0; i <= endPos; i++) {
        path.push(i)
      }
    } else {
      // Dodaj wszystkie pola od startPos+1 do endPos
      for (let i = startPos + 1; i <= endPos; i++) {
        path.push(i)
      }
    }

    return path
  }

  // Funkcja do obliczania pozycji 3D tokena na podstawie pozycji na planszy
  function getTokenPosition(position: number, playerId: number) {
    const boardSize = 12 // Rozmiar planszy
    const fieldSize = 1.2 // Rozmiar pola
    const side = Math.floor(position / 10)
    const posInSide = position % 10

    // Dodaj małe przesunięcie dla każdego gracza, aby uniknąć nakładania się
    const offsetX = (playerId % 2) * 0.3 - 0.15
    const offsetZ = (Math.floor(playerId / 2) % 2) * 0.3 - 0.15

    // Górna strona (0-10)
    if (side === 0) {
      return [boardSize / 2 - fieldSize * posInSide + offsetX, 0.3, -boardSize / 2 + offsetZ]
    }
    // Lewa strona (11-20)
    else if (side === 1) {
      return [-boardSize / 2 + offsetX, 0.3, -boardSize / 2 + fieldSize * posInSide + offsetZ]
    }
    // Dolna strona (21-30)
    else if (side === 2) {
      return [-boardSize / 2 + fieldSize * posInSide + offsetX, 0.3, boardSize / 2 + offsetZ]
    }
    // Prawa strona (31-39)
    else {
      return [boardSize / 2 + offsetX, 0.3, boardSize / 2 - fieldSize * posInSide + offsetZ]
    }
  }

  // Animacja tokena
  useFrame((state, delta) => {
    // Animacja obrotu dla aktywnego gracza
    if (ref.current && isActive) {
      ref.current.rotation.y += 0.01
    }

    // Animacja ruchu
    if (isAnimating && movePath.length > 0) {
      animationTimeRef.current += delta

      // Jeśli czas animacji przekroczył 0.3 sekundy, przejdź do następnego pola
      if (animationTimeRef.current > 0.3) {
        animationTimeRef.current = 0

        // Jeśli są jeszcze pola do przejścia
        if (pathIndex < movePath.length) {
          const nextPosition = movePath[pathIndex]
          setCurrentPosition(nextPosition)
          setTokenPosition(getTokenPosition(nextPosition, player.id))
          setPathIndex(pathIndex + 1)
        } else {
          // Zakończ animację
          setIsAnimating(false)
        }
      }
    }
  })

  return (
    <group position={tokenPosition} ref={ref}>
      <mesh castShadow>
        <cylinderGeometry args={[0.2, 0.2, 0.4, 32]} />
        <meshStandardMaterial color={player.color} />
      </mesh>

      {isActive && (
        <mesh position={[0, 0.4, 0]}>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshStandardMaterial color="#ffffff" emissive={player.color} emissiveIntensity={0.5} />
        </mesh>
      )}

      <Text position={[0, 0.3, 0]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.15} color="#ffffff">
        {player.isAI ? "AI" : "P"}
      </Text>
    </group>
  )
}
