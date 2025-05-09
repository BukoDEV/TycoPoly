"use client"

import { useRef } from "react"
import { useFrame } from "@react-three/fiber"

interface BuildingProps {
  position: [number, number, number]
  rotation: [number, number, number]
  type: "house" | "hotel"
}

export function Building({ position, rotation, type }: BuildingProps) {
  const ref = useRef()

  // Dodajemy delikatną animację unoszenia się budynków
  useFrame((state) => {
    if (ref.current) {
      ref.current.position.y = 0.05 + Math.sin(state.clock.elapsedTime * 2 + position[0]) * 0.01
    }
  })

  if (type === "house") {
    return <House position={position} rotation={rotation} ref={ref} />
  } else {
    return <Hotel position={position} rotation={rotation} ref={ref} />
  }
}

// Model domu
function House({ position, rotation, ...props }) {
  return (
    <group position={position} rotation={rotation} {...props}>
      {/* Podstawa domu */}
      <mesh castShadow position={[0, 0.05, 0]}>
        <boxGeometry args={[0.15, 0.1, 0.15]} />
        <meshStandardMaterial color="#22c55e" />
      </mesh>

      {/* Dach domu */}
      <mesh castShadow position={[0, 0.15, 0]}>
        <coneGeometry args={[0.12, 0.1, 4]} />
        <meshStandardMaterial color="#15803d" />
      </mesh>
    </group>
  )
}

// Model hotelu
function Hotel({ position, rotation, ...props }) {
  return (
    <group position={position} rotation={rotation} {...props}>
      {/* Podstawa hotelu */}
      <mesh castShadow position={[0, 0.1, 0]}>
        <boxGeometry args={[0.2, 0.2, 0.2]} />
        <meshStandardMaterial color="#ef4444" />
      </mesh>

      {/* Górna część hotelu */}
      <mesh castShadow position={[0, 0.25, 0]}>
        <boxGeometry args={[0.15, 0.1, 0.15]} />
        <meshStandardMaterial color="#b91c1c" />
      </mesh>

      {/* Dach hotelu */}
      <mesh castShadow position={[0, 0.35, 0]}>
        <boxGeometry args={[0.22, 0.05, 0.22]} />
        <meshStandardMaterial color="#7f1d1d" />
      </mesh>
    </group>
  )
}
