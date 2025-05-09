"use client"
import { useRef, useState, forwardRef, useImperativeHandle } from "react"
import { useFrame } from "@react-three/fiber"
import { RigidBody } from "@react-three/rapier"
import { Text } from "@react-three/drei"
import * as THREE from "three"

interface DiceProps {
  position: [number, number, number]
  onRollComplete?: (value: number) => void
  diceId: number
  color?: string
}

// Definicja normalnych dla każdej ściany kostki
const FACE_NORMALS = [
  new THREE.Vector3(0, 1, 0), // Góra - 6
  new THREE.Vector3(0, -1, 0), // Dół - 1
  new THREE.Vector3(0, 0, 1), // Przód - 4
  new THREE.Vector3(0, 0, -1), // Tył - 3
  new THREE.Vector3(1, 0, 0), // Prawo - 5
  new THREE.Vector3(-1, 0, 0), // Lewo - 2
]

// Wartości odpowiadające każdej ścianie (zgodnie z tradycyjną kostką)
const FACE_VALUES = [6, 1, 4, 3, 5, 2]

const PreciseDice = forwardRef(({ position, onRollComplete, diceId, color = "white" }: DiceProps, ref) => {
  const diceRef = useRef<any>(null)
  const [result, setResult] = useState<number | null>(null)
  const [isRolling, setIsRolling] = useState(false)
  const stableTimeRef = useRef(0)
  const initialPosition = useRef(position)
  const lastResultRef = useRef<number | null>(null)
  const debugInfoRef = useRef<string>("")

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    roll: () => {
      roll()
    },
    getResult: () => result,
    isRolling: () => isRolling,
    resetPosition: () => {
      if (diceRef.current) {
        diceRef.current.setTranslation({
          x: initialPosition.current[0],
          y: initialPosition.current[1],
          z: initialPosition.current[2],
        })
        diceRef.current.setRotation({ x: 0, y: 0, z: 0 })
        diceRef.current.setLinvel({ x: 0, y: 0, z: 0 })
        diceRef.current.setAngvel({ x: 0, y: 0, z: 0 })
      }
    },
    forceResult: (forcedValue: number) => {
      if (forcedValue >= 1 && forcedValue <= 6) {
        console.log(`Forcing dice ${diceId} to show ${forcedValue}`)
        setResult(forcedValue)
        lastResultRef.current = forcedValue
        if (onRollComplete) {
          onRollComplete(forcedValue)
        }
      }
    },
    getDebugInfo: () => debugInfoRef.current,
  }))

  // Function to roll the dice
  const roll = () => {
    if (!diceRef.current || isRolling) return

    setIsRolling(true)
    stableTimeRef.current = 0
    setResult(null)
    lastResultRef.current = null

    // Reset position with some height and apply random rotation
    diceRef.current.setTranslation({ x: position[0], y: position[1] + 3, z: position[2] })
    diceRef.current.setRotation({
      x: Math.random() * Math.PI * 2,
      y: Math.random() * Math.PI * 2,
      z: Math.random() * Math.PI * 2,
    })

    // Apply random impulse and torque
    diceRef.current.applyImpulse({ x: (Math.random() - 0.5) * 3, y: -5, z: (Math.random() - 0.5) * 3 }, true)
    diceRef.current.applyTorqueImpulse(
      { x: (Math.random() - 0.5) * 3, y: (Math.random() - 0.5) * 3, z: (Math.random() - 0.5) * 3 },
      true,
    )
  }

  // Funkcja do określania, która ściana kostki jest skierowana do góry
  const determineUpFace = () => {
    if (!diceRef.current) return null

    // Pobierz rotację kostki
    const rotation = diceRef.current.rotation()

    // Utwórz macierz rotacji
    const rotationMatrix = new THREE.Matrix4().makeRotationFromQuaternion(
      new THREE.Quaternion(rotation.x, rotation.y, rotation.z, rotation.w),
    )

    // Wektor "do góry" w przestrzeni świata
    const worldUp = new THREE.Vector3(0, 1, 0)

    // Znajdź ścianę, której normalna jest najbardziej zbliżona do wektora "do góry"
    let maxDot = Number.NEGATIVE_INFINITY
    let upFaceIndex = -1

    FACE_NORMALS.forEach((normal, index) => {
      // Przekształć normalną ściany przez macierz rotacji kostki
      const rotatedNormal = normal.clone().applyMatrix4(rotationMatrix)

      // Oblicz iloczyn skalarny z wektorem "do góry"
      const dot = rotatedNormal.dot(worldUp)

      // Zapisz informacje debugowe
      debugInfoRef.current += `Face ${index + 1}: dot=${dot.toFixed(2)} `

      // Jeśli ten iloczyn jest większy niż poprzedni maksymalny, zaktualizuj
      if (dot > maxDot) {
        maxDot = dot
        upFaceIndex = index
      }
    })

    // Dodaj informację o wybranej ścianie
    debugInfoRef.current += `| Selected: ${upFaceIndex + 1} (value: ${FACE_VALUES[upFaceIndex]})`

    // Zwróć wartość odpowiadającą górnej ścianie
    return FACE_VALUES[upFaceIndex]
  }

  // Check if the dice has stopped and determine the result
  useFrame(() => {
    if (!diceRef.current) return

    // Check if dice fell off the table
    const position = diceRef.current.translation()
    if (position.y < -5) {
      console.log(`Dice ${diceId} fell off the table, resetting...`)
      diceRef.current.setTranslation({
        x: initialPosition.current[0],
        y: initialPosition.current[1] + 3,
        z: initialPosition.current[2],
      })
      diceRef.current.setLinvel({ x: 0, y: -5, z: 0 })
      diceRef.current.setAngvel({ x: 0, y: 0, z: 0 })
    }

    if (!isRolling) return

    // Check if dice has stopped moving
    const lin = diceRef.current.linvel()
    const ang = diceRef.current.angvel()
    const isStable =
      Math.abs(lin.x) < 0.05 &&
      Math.abs(lin.y) < 0.05 &&
      Math.abs(lin.z) < 0.05 &&
      Math.abs(ang.x) < 0.05 &&
      Math.abs(ang.y) < 0.05 &&
      Math.abs(ang.z) < 0.05

    if (isStable) {
      stableTimeRef.current++
      if (stableTimeRef.current > 30) {
        // Resetuj informacje debugowe
        debugInfoRef.current = ""

        // Określ, która ściana jest skierowana do góry
        const diceResult = determineUpFace()

        console.log(`Dice ${diceId} result: ${diceResult}, debug: ${debugInfoRef.current}`)

        setResult(diceResult)
        lastResultRef.current = diceResult
        setIsRolling(false)

        if (onRollComplete) {
          onRollComplete(diceResult)
        }
      }
    } else {
      stableTimeRef.current = 0
    }
  })

  // Generate the material color with slight color adjustments for each face
  const getFaceColor = (faceIndex: number) => {
    if (color === "red") {
      // Shades of red
      const shades = ["#ff0000", "#e60000", "#cc0000", "#b30000", "#990000", "#800000"]
      return shades[faceIndex % 6]
    } else if (color === "blue") {
      // Shades of blue
      const shades = ["#0066ff", "#0052cc", "#003d99", "#002966", "#001433", "#000066"]
      return shades[faceIndex % 6]
    } else {
      // Shades of white/gray
      const shades = ["#ffffff", "#f2f2f2", "#e6e6e6", "#d9d9d9", "#cccccc", "#bfbfbf"]
      return shades[faceIndex % 6]
    }
  }

  return (
    <group>
      <RigidBody ref={diceRef} position={position} colliders="cuboid" restitution={0.3} friction={0.8}>
        {/* Dice with large, clear numbers */}
        <group>
          {/* Base cube */}
          <mesh castShadow receiveShadow>
            <boxGeometry args={[0.9, 0.9, 0.9]} />
            <meshStandardMaterial color={color} roughness={0.3} metalness={0.2} />
          </mesh>

          {/* Face 1 (Bottom) - Value 1 */}
          <mesh position={[0, -0.451, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.85, 0.85]} />
            <meshStandardMaterial color={getFaceColor(0)} />
          </mesh>
          <Text position={[0, -0.46, 0]} rotation={[Math.PI / 2, 0, 0]} fontSize={0.4} color="black">
            1
          </Text>

          {/* Face 2 (Left) - Value 2 */}
          <mesh position={[-0.451, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
            <planeGeometry args={[0.85, 0.85]} />
            <meshStandardMaterial color={getFaceColor(1)} />
          </mesh>
          <Text position={[-0.46, 0, 0]} rotation={[0, -Math.PI / 2, 0]} fontSize={0.4} color="black">
            2
          </Text>

          {/* Face 3 (Back) - Value 3 */}
          <mesh position={[0, 0, -0.451]} rotation={[0, Math.PI, 0]}>
            <planeGeometry args={[0.85, 0.85]} />
            <meshStandardMaterial color={getFaceColor(2)} />
          </mesh>
          <Text position={[0, 0, -0.46]} rotation={[0, Math.PI, 0]} fontSize={0.4} color="black">
            3
          </Text>

          {/* Face 4 (Front) - Value 4 */}
          <mesh position={[0, 0, 0.451]}>
            <planeGeometry args={[0.85, 0.85]} />
            <meshStandardMaterial color={getFaceColor(3)} />
          </mesh>
          <Text position={[0, 0, 0.46]} fontSize={0.4} color="black">
            4
          </Text>

          {/* Face 5 (Right) - Value 5 */}
          <mesh position={[0.451, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
            <planeGeometry args={[0.85, 0.85]} />
            <meshStandardMaterial color={getFaceColor(4)} />
          </mesh>
          <Text position={[0.46, 0, 0]} rotation={[0, Math.PI / 2, 0]} fontSize={0.4} color="black">
            5
          </Text>

          {/* Face 6 (Top) - Value 6 */}
          <mesh position={[0, 0.451, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.85, 0.85]} />
            <meshStandardMaterial color={getFaceColor(5)} />
          </mesh>
          <Text position={[0, 0.46, 0]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.4} color="black">
            6
          </Text>
        </group>
      </RigidBody>

      {/* Display result as floating text when not rolling */}
      {result && !isRolling && (
        <Text
          position={[position[0], position[1] + 1.2, position[2]]}
          fontSize={0.3}
          color={color === "white" ? "black" : color}
          anchorX="center"
          anchorY="middle"
          backgroundColor="rgba(255,255,255,0.7)"
          padding={0.1}
        >
          {result}
        </Text>
      )}
    </group>
  )
})

PreciseDice.displayName = "PreciseDice"
export default PreciseDice
