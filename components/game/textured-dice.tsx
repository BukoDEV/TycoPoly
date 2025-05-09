"use client"

import * as THREE from "three"
import { useRef, useState, forwardRef, useImperativeHandle, useMemo } from "react"
import { useFrame } from "@react-three/fiber"
import { RigidBody } from "@react-three/rapier"

interface DiceProps {
  position: [number, number, number]
  onRollComplete?: (value: number) => void
}

// Funkcja tworząca teksturę z oczkami
function createDiceTexture(pips: number[][], backgroundColor = "#ffffff", pipColor = "#000000") {
  // Tworzymy canvas o wymiarach 128x128 pikseli
  const canvas = document.createElement("canvas")
  canvas.width = 128
  canvas.height = 128
  const context = canvas.getContext("2d")

  if (!context) return null

  // Wypełniamy tło
  context.fillStyle = backgroundColor
  context.fillRect(0, 0, 128, 128)

  // Rysujemy oczka
  context.fillStyle = pipColor

  // Rozmiar i pozycje oczek
  const pipRadius = 10
  pips.forEach(([x, y]) => {
    // Przekształcamy współrzędne z zakresu [-0.5, 0.5] do [0, 128]
    const pixelX = (x + 0.5) * 128
    const pixelY = (y + 0.5) * 128

    context.beginPath()
    context.arc(pixelX, pixelY, pipRadius, 0, Math.PI * 2)
    context.fill()
  })

  // Dodajemy obramowanie dla lepszego wyglądu
  context.strokeStyle = "#cccccc"
  context.lineWidth = 4
  context.strokeRect(4, 4, 120, 120)

  // Tworzymy teksturę z canvas
  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true
  return texture
}

// Konfiguracja pozycji oczek dla każdej ścianki
const pipPositions = {
  1: [[0, 0]], // Środek
  2: [
    [-0.3, 0.3], // Lewy górny
    [0.3, -0.3], // Prawy dolny
  ],
  3: [
    [-0.3, 0.3], // Lewy górny
    [0, 0], // Środek
    [0.3, -0.3], // Prawy dolny
  ],
  4: [
    [-0.3, 0.3], // Lewy górny
    [-0.3, -0.3], // Lewy dolny
    [0.3, 0.3], // Prawy górny
    [0.3, -0.3], // Prawy dolny
  ],
  5: [
    [-0.3, 0.3], // Lewy górny
    [-0.3, -0.3], // Lewy dolny
    [0, 0], // Środek
    [0.3, 0.3], // Prawy górny
    [0.3, -0.3], // Prawy dolny
  ],
  6: [
    [-0.3, 0.3], // Lewy górny
    [-0.3, 0], // Lewy środek
    [-0.3, -0.3], // Lewy dolny
    [0.3, 0.3], // Prawy górny
    [0.3, 0], // Prawy środek
    [0.3, -0.3], // Prawy dolny
  ],
}

const TexturedDice = forwardRef(({ position, onRollComplete }: DiceProps, ref) => {
  const diceRef = useRef<any>(null)
  const [result, setResult] = useState<number | null>(null)
  const [isRolling, setIsRolling] = useState(false)
  const stableTimeRef = useRef(0)

  // Tworzymy tekstury dla każdej ścianki
  const diceTextures = useMemo(() => {
    // Sprawdzamy, czy jesteśmy w środowisku przeglądarki
    if (typeof window === "undefined") return Array(6).fill(null)

    return [1, 2, 3, 4, 5, 6].map((num) => createDiceTexture(pipPositions[num]))
  }, [])

  // Tworzymy materiały dla każdej ścianki
  const diceMaterials = useMemo(() => {
    return diceTextures.map((texture) => {
      if (!texture) {
        // Fallback dla SSR
        return new THREE.MeshStandardMaterial({
          color: "#ffffff",
          roughness: 0.3,
          metalness: 0.2,
        })
      }
      return new THREE.MeshStandardMaterial({
        map: texture,
        roughness: 0.3,
        metalness: 0.2,
      })
    })
  }, [diceTextures])

  // Udostępniamy metody na zewnątrz
  useImperativeHandle(ref, () => ({
    roll: () => {
      roll()
    },
    getResult: () => result,
    isRolling: () => isRolling,
  }))

  // Funkcja do rzucania kostką
  const roll = () => {
    if (!diceRef.current || isRolling) return
    setIsRolling(true)
    stableTimeRef.current = 0
    setResult(null)

    // Resetujemy pozycję i dodajemy losową rotację
    diceRef.current.setTranslation({ x: position[0], y: position[1] + 3, z: position[2] })
    diceRef.current.setRotation({
      x: Math.random() * Math.PI * 2,
      y: Math.random() * Math.PI * 2,
      z: Math.random() * Math.PI * 2,
    })

    // Dodajemy losowy impuls i moment obrotowy
    diceRef.current.applyImpulse({ x: (Math.random() - 0.5) * 3, y: -5, z: (Math.random() - 0.5) * 3 }, true)
    diceRef.current.applyTorqueImpulse(
      { x: (Math.random() - 0.5) * 3, y: (Math.random() - 0.5) * 3, z: (Math.random() - 0.5) * 3 },
      true,
    )
  }

  // Mapowanie ścianek kostki do wartości
  const faceToValue = [1, 6, 2, 5, 3, 4] // [+x, -x, +y, -y, +z, -z]

  // Funkcja określająca wynik rzutu
  const determineResult = () => {
    if (!diceRef.current) return null

    const rotation = diceRef.current.rotation()
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(rotation.x, rotation.y, rotation.z))

    // Wektory normalne dla każdej ścianki w lokalnym układzie współrzędnych
    const normals = [
      new THREE.Vector3(1, 0, 0), // +x (ścianka 1)
      new THREE.Vector3(-1, 0, 0), // -x (ścianka 6)
      new THREE.Vector3(0, 1, 0), // +y (ścianka 2)
      new THREE.Vector3(0, -1, 0), // -y (ścianka 5)
      new THREE.Vector3(0, 0, 1), // +z (ścianka 3)
      new THREE.Vector3(0, 0, -1), // -z (ścianka 4)
    ]

    // Wektor "w górę" w przestrzeni globalnej
    const up = new THREE.Vector3(0, 1, 0)

    // Znajdź ściankę, która jest najbardziej skierowana do góry
    let maxDot = Number.NEGATIVE_INFINITY
    let topFaceIndex = 0

    normals.forEach((normal, index) => {
      // Zastosuj rotację kostki do wektora normalnego
      const rotatedNormal = normal.clone().applyQuaternion(q)
      const dot = rotatedNormal.dot(up)

      if (dot > maxDot) {
        maxDot = dot
        topFaceIndex = index
      }
    })

    // Zwróć wartość odpowiadającą górnej ściance
    return faceToValue[topFaceIndex]
  }

  // Sprawdzamy, czy kostka się zatrzymała
  useFrame(() => {
    if (!isRolling || !diceRef.current) return

    const lin = diceRef.current.linvel()
    const ang = diceRef.current.angvel()
    const isStable =
      Math.abs(lin.x) < 0.1 &&
      Math.abs(lin.y) < 0.1 &&
      Math.abs(lin.z) < 0.1 &&
      Math.abs(ang.x) < 0.1 &&
      Math.abs(ang.y) < 0.1 &&
      Math.abs(ang.z) < 0.1

    if (isStable) {
      stableTimeRef.current++
      if (stableTimeRef.current > 60) {
        const diceResult = determineResult()
        setResult(diceResult)
        setIsRolling(false)
        if (onRollComplete) {
          onRollComplete(diceResult)
        }
      }
    } else {
      stableTimeRef.current = 0
    }
  })

  return (
    <RigidBody ref={diceRef} position={position} colliders="cuboid" restitution={0.3} friction={0.8}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[0.8, 0.8, 0.8]} />
        {/* Używamy tablicy materiałów dla każdej ścianki */}
        <meshStandardMaterial attach="material-0" {...diceMaterials[0]} />
        <meshStandardMaterial attach="material-1" {...diceMaterials[1]} />
        <meshStandardMaterial attach="material-2" {...diceMaterials[2]} />
        <meshStandardMaterial attach="material-3" {...diceMaterials[3]} />
        <meshStandardMaterial attach="material-4" {...diceMaterials[4]} />
        <meshStandardMaterial attach="material-5" {...diceMaterials[5]} />
      </mesh>
    </RigidBody>
  )
})

TexturedDice.displayName = "TexturedDice"
export default TexturedDice
