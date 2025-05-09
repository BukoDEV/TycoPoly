"use client"

import { Suspense, useState } from "react"
import { Canvas } from "@react-three/fiber"
import { OrbitControls, PerspectiveCamera, Environment } from "@react-three/drei"
import { Physics, RigidBody } from "@react-three/rapier"
import { useGameStore } from "@/store/game-store"
import Reliable3DDiceRoller from "./reliable-3d-dice-roller"
import BoardField from "./board-field"
import PropertyModal from "./property-modal"
import PlayerToken from "./player-token"

interface GameBoard3DProps {
  onDiceRoll: (diceSum: number, isDoubles: boolean) => void
}

export default function GameBoard3D({ onDiceRoll }: GameBoard3DProps) {
  const [selectedProperty, setSelectedProperty] = useState(null)
  const [showPropertyModal, setShowPropertyModal] = useState(false)

  const handlePropertyClick = (property) => {
    if (property.type === "property") {
      setSelectedProperty(property)
      setShowPropertyModal(true)
    }
  }

  const handlePropertyModalClose = () => {
    setShowPropertyModal(false)
    setSelectedProperty(null)
  }

  return (
    <div className="w-full h-full">
      <Canvas shadows>
        <Suspense fallback={null}>
          <Environment preset="city" />
          <PerspectiveCamera makeDefault position={[0, 15, 15]} />
          <OrbitControls minPolarAngle={Math.PI / 6} maxPolarAngle={Math.PI / 2.5} minDistance={10} maxDistance={25} />
          <ambientLight intensity={0.5} />
          <directionalLight
            position={[10, 10, 5]}
            intensity={1}
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
          />
          <Physics gravity={[0, -30, 0]}>
            <Board onPropertyClick={handlePropertyClick} />
            <Reliable3DDiceRoller onRoll={onDiceRoll} />
          </Physics>
        </Suspense>
      </Canvas>

      {showPropertyModal && selectedProperty && (
        <PropertyModal property={selectedProperty} onClose={handlePropertyModalClose} />
      )}
    </div>
  )
}

function Board({ onPropertyClick }) {
  const { board, players, currentPlayerIndex } = useGameStore()

  // Handle field click
  const handleFieldClick = (field) => {
    onPropertyClick(field)
  }

  return (
    <group>
      {/* Table - base (physical) */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh receiveShadow position={[0, -1, 0]}>
          <boxGeometry args={[24, 2, 24]} />
          <meshStandardMaterial color="#8B4513" roughness={0.8} metalness={0.2} />
        </mesh>
      </RigidBody>

      {/* Board border (physical) */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh receiveShadow position={[0, 0.1, 0]}>
          <boxGeometry args={[14, 0.2, 14]} />
          <meshStandardMaterial color="#1a5336" />
        </mesh>
      </RigidBody>

      {/* Board center (physical) */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh receiveShadow position={[0, 0.2, 0]}>
          <boxGeometry args={[10, 0.1, 10]} />
          <meshStandardMaterial color="#2d8659" />
        </mesh>
      </RigidBody>

      {/* Invisible barriers around the table */}
      <TableBarriers />

      {/* Board fields */}
      <group position={[0, 0.3, 0]}>
        {board.map((field, index) => (
          <group key={index} onClick={() => handleFieldClick(field)}>
            <BoardField field={field} position={index} players={players} />
          </group>
        ))}
      </group>

      {/* Player tokens */}
      <group position={[0, 0.3, 0]}>
        {players.map((player) => (
          <PlayerToken key={player.id} player={player} isActive={player.id === players[currentPlayerIndex].id} />
        ))}
      </group>
    </group>
  )
}

// Component creating invisible barriers around the table
function TableBarriers() {
  const tableSize = 24 // Table size
  const barrierHeight = 5 // Barrier height
  const barrierThickness = 0.5 // Barrier thickness

  return (
    <>
      {/* Front barrier */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[0, barrierHeight / 2, tableSize / 2 + barrierThickness / 2]}>
          <boxGeometry args={[tableSize + barrierThickness * 2, barrierHeight, barrierThickness]} />
          <meshStandardMaterial color="transparent" opacity={0} transparent />
        </mesh>
      </RigidBody>

      {/* Back barrier */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[0, barrierHeight / 2, -tableSize / 2 - barrierThickness / 2]}>
          <boxGeometry args={[tableSize + barrierThickness * 2, barrierHeight, barrierThickness]} />
          <meshStandardMaterial color="transparent" opacity={0} transparent />
        </mesh>
      </RigidBody>

      {/* Left barrier */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[-tableSize / 2 - barrierThickness / 2, barrierHeight / 2, 0]}>
          <boxGeometry args={[barrierThickness, barrierHeight, tableSize + barrierThickness * 2]} />
          <meshStandardMaterial color="transparent" opacity={0} transparent />
        </mesh>
      </RigidBody>

      {/* Right barrier */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[tableSize / 2 + barrierThickness / 2, barrierHeight / 2, 0]}>
          <boxGeometry args={[barrierThickness, barrierHeight, tableSize + barrierThickness * 2]} />
          <meshStandardMaterial color="transparent" opacity={0} transparent />
        </mesh>
      </RigidBody>

      {/* Floor under the table (in case dice fall off) */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[0, -10, 0]}>
          <boxGeometry args={[50, 1, 50]} />
          <meshStandardMaterial color="transparent" opacity={0} transparent />
        </mesh>
      </RigidBody>
    </>
  )
}
