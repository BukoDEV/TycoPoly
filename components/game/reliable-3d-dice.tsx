"use client"

import * as THREE from "three"
import { useRef, useState, forwardRef, useImperativeHandle } from "react"
import { useFrame } from "@react-three/fiber"
import { RigidBody } from "@react-three/rapier"
import { Text } from "@react-three/drei"

interface DiceProps {
  position: [number, number, number]
  onRollComplete?: (value: number) => void
  diceId: number
  color?: string
}

const Reliable3DDice = forwardRef(({ position, onRollComplete, diceId, color = "white" }: DiceProps, ref) => {
  const diceRef = useRef<any>(null)
  const [result, setResult] = useState<number | null>(null)
  const [isRolling, setIsRolling] = useState(false)
  const stableTimeRef = useRef(0)
  const initialPosition = useRef(position)
  const [debugInfo, setDebugInfo] = useState("")

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
        if (onRollComplete) {
          onRollComplete(forcedValue)
        }
      }
    },
  }))

  // Function to roll the dice
  const roll = () => {
    if (!diceRef.current || isRolling) return

    setIsRolling(true)
    stableTimeRef.current = 0
    setResult(null)
    setDebugInfo("")

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

  // COMPLETELY REVISED function to determine the dice result
  const determineResult = () => {
    if (!diceRef.current) return null

    // Get the dice rotation as a quaternion
    const rotation = diceRef.current.rotation()
    const quaternion = new THREE.Quaternion().setFromEuler(new THREE.Euler(rotation.x, rotation.y, rotation.z))

    // Define the face normals in local space
    // These are the directions perpendicular to each face in the dice's local coordinate system
    const faceNormals = [
      new THREE.Vector3(0, 1, 0), // Top face (6)
      new THREE.Vector3(0, -1, 0), // Bottom face (1)
      new THREE.Vector3(1, 0, 0), // Right face (5)
      new THREE.Vector3(-1, 0, 0), // Left face (2)
      new THREE.Vector3(0, 0, 1), // Front face (4)
      new THREE.Vector3(0, 0, -1), // Back face (3)
    ]

    // The values on each face (standard dice has opposite faces summing to 7)
    const faceValues = [6, 1, 5, 2, 4, 3]

    // The global up vector
    const worldUp = new THREE.Vector3(0, 1, 0)

    // Find which face normal is most aligned with the world up vector
    let maxAlignment = Number.NEGATIVE_INFINITY
    let topFaceIndex = -1

    // Debug info for all faces
    let debugText = ""

    for (let i = 0; i < faceNormals.length; i++) {
      // Clone the normal so we don't modify the original
      const normal = faceNormals[i].clone()

      // Transform the normal from local to world space using the dice's rotation
      normal.applyQuaternion(quaternion)

      // Calculate how aligned this normal is with the world up vector
      const alignment = normal.dot(worldUp)

      // Add to debug info
      debugText += `Face ${faceValues[i]}: ${alignment.toFixed(2)} | `

      // If this is the most upward-pointing face so far, remember it
      if (alignment > maxAlignment) {
        maxAlignment = alignment
        topFaceIndex = i
      }
    }

    // If we found a valid face
    if (topFaceIndex !== -1) {
      const topValue = faceValues[topFaceIndex]

      // Set debug info
      setDebugInfo(`Dice ${diceId}: ${topValue} (${maxAlignment.toFixed(2)})`)
      console.log(`Dice ${diceId} result: ${topValue}, alignment: ${maxAlignment.toFixed(4)}`)
      console.log(debugText)

      return topValue
    }

    // Fallback to a random value if something went wrong
    console.error("Failed to determine dice result, using random value")
    return Math.floor(Math.random() * 6) + 1
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
        // Reduced from 60 to make it faster
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

          {/* Face 1 (Bottom) */}
          <mesh position={[0, -0.451, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.85, 0.85]} />
            <meshStandardMaterial color={getFaceColor(0)} />
          </mesh>
          <Text position={[0, -0.46, 0]} rotation={[Math.PI / 2, 0, 0]} fontSize={0.4} color="black">
            1
          </Text>

          {/* Face 2 (Left) */}
          <mesh position={[-0.451, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
            <planeGeometry args={[0.85, 0.85]} />
            <meshStandardMaterial color={getFaceColor(1)} />
          </mesh>
          <Text position={[-0.46, 0, 0]} rotation={[0, -Math.PI / 2, 0]} fontSize={0.4} color="black">
            2
          </Text>

          {/* Face 3 (Back) */}
          <mesh position={[0, 0, -0.451]} rotation={[0, Math.PI, 0]}>
            <planeGeometry args={[0.85, 0.85]} />
            <meshStandardMaterial color={getFaceColor(2)} />
          </mesh>
          <Text position={[0, 0, -0.46]} rotation={[0, Math.PI, 0]} fontSize={0.4} color="black">
            3
          </Text>

          {/* Face 4 (Front) */}
          <mesh position={[0, 0, 0.451]}>
            <planeGeometry args={[0.85, 0.85]} />
            <meshStandardMaterial color={getFaceColor(3)} />
          </mesh>
          <Text position={[0, 0, 0.46]} fontSize={0.4} color="black">
            4
          </Text>

          {/* Face 5 (Right) */}
          <mesh position={[0.451, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
            <planeGeometry args={[0.85, 0.85]} />
            <meshStandardMaterial color={getFaceColor(4)} />
          </mesh>
          <Text position={[0.46, 0, 0]} rotation={[0, Math.PI / 2, 0]} fontSize={0.4} color="black">
            5
          </Text>

          {/* Face 6 (Top) */}
          <mesh position={[0, 0.451, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.85, 0.85]} />
            <meshStandardMaterial color={getFaceColor(5)} />
          </mesh>
          <Text position={[0, 0.46, 0]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.4} color="black">
            6
          </Text>
        </group>
      </RigidBody>

      {/* Display debug info */}
      {debugInfo && (
        <Text
          position={[position[0], position[1] + 1.2, position[2]]}
          fontSize={0.2}
          color={color === "white" ? "black" : color}
          anchorX="center"
          anchorY="middle"
          backgroundColor="rgba(255,255,255,0.7)"
          padding={0.05}
        >
          {debugInfo}
        </Text>
      )}
    </group>
  )
})

Reliable3DDice.displayName = "Reliable3DDice"
export default Reliable3DDice
