"use client"

import { useRef } from "react"
import { useFrame } from "@react-three/fiber"
import { Text } from "@react-three/drei"

interface SpecialFieldMarkerProps {
  type: string
  position: [number, number, number]
  rotation: [number, number, number]
}

export function SpecialFieldMarker({ type, position, rotation }: SpecialFieldMarkerProps) {
  const ref = useRef()

  // Animacja unoszenia się markera
  useFrame((state) => {
    if (ref.current) {
      ref.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.05
    }
  })

  // Wybierz kolor i symbol w zależności od typu pola
  const getMarkerProps = () => {
    switch (type) {
      case "start":
        return {
          color: "#22c55e",
          symbol: "→",
          text: "START",
        }
      case "jail":
        return {
          color: "#6b7280",
          symbol: "⛓",
          text: "WIĘZIENIE",
        }
      case "go-to-jail":
        return {
          color: "#ef4444",
          symbol: "⚠",
          text: "IDŹ DO WIĘZIENIA",
        }
      case "parking":
        return {
          color: "#f59e0b",
          symbol: "P",
          text: "PARKING",
        }
      default:
        return {
          color: "#cccccc",
          symbol: "?",
          text: "",
        }
    }
  }

  const { color, symbol, text } = getMarkerProps()

  return (
    <group position={position} rotation={rotation} ref={ref}>
      {/* Symbol 3D */}
      <mesh castShadow>
        <cylinderGeometry args={[0.3, 0.3, 0.1, 32]} />
        <meshStandardMaterial color={color} />
      </mesh>

      {/* Symbol na górze */}
      <Text position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.15} color="#ffffff">
        {symbol}
      </Text>

      {/* Tekst pod spodem */}
      <Text position={[0, -0.06, 0]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.08} color="#ffffff">
        {text}
      </Text>
    </group>
  )
}
