"use client"

import { useState, useEffect, useRef } from "react"
import { Html } from "@react-three/drei"
import { useGameStore } from "@/store/game-store"
import PreciseDice from "./precise-dice"

// Add this at the top, after your imports
declare global {
  interface Window {
    rollDice: () => Promise<{ sum: number; isDoubles: boolean }>
  }
}

interface DiceRollerProps {
  onRoll: (sum: number, isDoubles: boolean) => void
}

export default function Reliable3DDiceRoller({ onRoll }: DiceRollerProps) {
  const [dice1Value, setDice1Value] = useState<number | null>(null)
  const [dice2Value, setDice2Value] = useState<number | null>(null)
  const [isRolling, setIsRolling] = useState(false)
  const [rollComplete, setRollComplete] = useState(false)
  const [aiRollMessage, setAiRollMessage] = useState("")
  const [debugInfo, setDebugInfo] = useState("")
  const [stabilizationTimer, setStabilizationTimer] = useState(0)
  const [isStabilizing, setIsStabilizing] = useState(false)
  const [pendingRollResult, setPendingRollResult] = useState<{ sum: number; isDoubles: boolean } | null>(null)
  const { currentPlayerIndex, players, doublesCount, isAITurn } = useGameStore()

  const dice1Ref = useRef(null)
  const dice2Ref = useRef(null)
  const timeoutRef = useRef(null)
  const stabilizationIntervalRef = useRef(null)
  const completedDiceRef = useRef({ dice1: false, dice2: false })
  const aiRollValuesRef = useRef({ dice1: null, dice2: null })
  const lastPlayerIndexRef = useRef(currentPlayerIndex)

  // Efekt do obsługi wyniku rzutu po stabilizacji
  useEffect(() => {
    if (pendingRollResult !== null) {
      onRoll(pendingRollResult.sum, pendingRollResult.isDoubles)
      setPendingRollResult(null)
    }
  }, [pendingRollResult, onRoll])

  // Reset state when player changes
  useEffect(() => {
    if (lastPlayerIndexRef.current !== currentPlayerIndex) {
      console.log("Player changed, resetting dice values")
      setDice1Value(null)
      setDice2Value(null)
      setAiRollMessage("")
      setRollComplete(false)
      setIsStabilizing(false)
      setStabilizationTimer(0)
      setPendingRollResult(null)
      completedDiceRef.current = { dice1: false, dice2: false }
      aiRollValuesRef.current = { dice1: null, dice2: null }
      lastPlayerIndexRef.current = currentPlayerIndex
    }
  }, [currentPlayerIndex])

  // Function called when first dice completes rolling
  const handleDice1Complete = (value) => {
    console.log(`Dice 1 stopped: ${value}`)
    setDice1Value(value)
    completedDiceRef.current.dice1 = true
    checkBothDiceComplete()
  }

  // Function called when second dice completes rolling
  const handleDice2Complete = (value) => {
    console.log(`Dice 2 stopped: ${value}`)
    setDice2Value(value)
    completedDiceRef.current.dice2 = true
    checkBothDiceComplete()
  }

  // Check if both dice have completed rolling
  const checkBothDiceComplete = () => {
    if (completedDiceRef.current.dice1 && completedDiceRef.current.dice2) {
      console.log("Both dice have stopped. Starting short stabilization period...")

      // Start short stabilization period (1 second)
      setIsStabilizing(true)
      setStabilizationTimer(1)

      // Clear any existing interval
      if (stabilizationIntervalRef.current) {
        clearInterval(stabilizationIntervalRef.current)
      }

      // Start countdown
      stabilizationIntervalRef.current = setInterval(() => {
        setStabilizationTimer((prev) => {
          const newValue = prev - 1
          if (newValue <= 0) {
            clearInterval(stabilizationIntervalRef.current)
            finalizeRoll()
            return 0
          }
          return newValue
        })
      }, 1000)
    }
  }

  // Finalize the roll after stabilization period
  const finalizeRoll = () => {
    // For AI use values passed in the event
    let finalDice1 = dice1Value
    let finalDice2 = dice2Value

    if (isAITurn() && aiRollValuesRef.current.dice1 !== null && aiRollValuesRef.current.dice2 !== null) {
      finalDice1 = aiRollValuesRef.current.dice1
      finalDice2 = aiRollValuesRef.current.dice2
      console.log(`Using AI values: ${finalDice1} + ${finalDice2}`)
    }

    const sum = finalDice1 + finalDice2
    const isDoubles = finalDice1 === finalDice2

    setRollComplete(true)
    setIsRolling(false)
    setIsStabilizing(false)

    console.log(`Roll complete: ${finalDice1} + ${finalDice2} = ${sum}, doubles: ${isDoubles}`)

    // Aktualizuj informacje debugowe
    if (dice1Ref.current && dice1Ref.current.getDebugInfo) {
      const dice1Debug = dice1Ref.current.getDebugInfo()
      const dice2Debug = dice2Ref.current ? dice2Ref.current.getDebugInfo() : ""
      setDebugInfo(`Dice 1: ${dice1Debug} | Dice 2: ${dice2Debug}`)
    }

    // Zamiast bezpośrednio wywoływać onRoll, ustawiamy pendingRollResult
    setPendingRollResult({ sum, isDoubles })

    // Reset state
    completedDiceRef.current = { dice1: false, dice2: false }
    aiRollValuesRef.current = { dice1: null, dice2: null }
  }

  // Function to roll the dice
  const rollDice = () => {
    // Don't allow rolling if animation is in progress or it's AI's turn
    if (isRolling || isStabilizing || isAITurn()) {
      return
    }

    console.log("Rolling dice...")
    setIsRolling(true)
    setRollComplete(false)
    setAiRollMessage("")
    setDebugInfo("")
    setStabilizationTimer(0)
    setPendingRollResult(null)

    // Kasujemy poprzednie wyniki
    setDice1Value(null)
    setDice2Value(null)

    completedDiceRef.current = { dice1: false, dice2: false }

    // Clear previous timeout and interval if exists
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    if (stabilizationIntervalRef.current) {
      clearInterval(stabilizationIntervalRef.current)
    }

    // Roll the dice
    if (dice1Ref.current && dice1Ref.current.roll) {
      dice1Ref.current.roll()
    }

    if (dice2Ref.current && dice2Ref.current.roll) {
      dice2Ref.current.roll()
    }

    // Add safety timeout in case dice don't stop
    timeoutRef.current = setTimeout(() => {
      if (isRolling && !rollComplete && !isStabilizing) {
        console.log("Timeout - dice didn't stop in expected time")

        // Generate random values
        const randomDice1 = Math.floor(Math.random() * 6) + 1
        const randomDice2 = Math.floor(Math.random() * 6) + 1

        // Force results
        if (dice1Ref.current && dice1Ref.current.forceResult) {
          dice1Ref.current.forceResult(randomDice1)
        } else {
          handleDice1Complete(randomDice1)
        }

        if (dice2Ref.current && dice2Ref.current.forceResult) {
          dice2Ref.current.forceResult(randomDice2)
        } else {
          handleDice2Complete(randomDice2)
        }
      }
    }, 8000) // 8 seconds timeout
  }

  // Function to simulate AI roll
  const simulateAIRoll = (dice1Value, dice2Value) => {
    console.log(`AI rolling: ${dice1Value}, ${dice2Value}`)
    setIsRolling(true)
    setRollComplete(false)
    setIsStabilizing(false)
    setStabilizationTimer(0)
    setPendingRollResult(null)

    // Kasujemy poprzednie wyniki
    setDice1Value(null)
    setDice2Value(null)

    completedDiceRef.current = { dice1: false, dice2: false }

    // Save AI dice values
    aiRollValuesRef.current = { dice1: dice1Value, dice2: dice2Value }

    // Clear previous timeout and interval if exists
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    if (stabilizationIntervalRef.current) {
      clearInterval(stabilizationIntervalRef.current)
    }

    // Roll the dice
    if (dice1Ref.current && dice1Ref.current.roll) {
      dice1Ref.current.roll()
    }

    if (dice2Ref.current && dice2Ref.current.roll) {
      dice2Ref.current.roll()
    }

    // Set AI roll message
    const currentPlayer = players[currentPlayerIndex]
    setAiRollMessage(`${currentPlayer?.name} wyrzucił ${dice1Value} i ${dice2Value} (suma: ${dice1Value + dice2Value})`)

    // Add safety timeout in case dice don't stop
    timeoutRef.current = setTimeout(() => {
      if (isRolling && !rollComplete && !isStabilizing) {
        console.log("AI Timeout - dice didn't stop in expected time")

        // Force results
        if (dice1Ref.current && dice1Ref.current.forceResult) {
          dice1Ref.current.forceResult(dice1Value)
        } else {
          handleDice1Complete(dice1Value)
        }

        if (dice2Ref.current && dice2Ref.current.forceResult) {
          dice2Ref.current.forceResult(dice2Value)
        } else {
          handleDice2Complete(dice2Value)
        }
      }
    }, 8000) // 8 seconds timeout
  }

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      if (stabilizationIntervalRef.current) {
        clearInterval(stabilizationIntervalRef.current)
      }
    }
  }, [])

  // Listen for AI roll events
  useEffect(() => {
    const handleAIRoll = (event) => {
      if (event.detail && event.detail.dice1 !== undefined && event.detail.dice2 !== undefined) {
        simulateAIRoll(event.detail.dice1, event.detail.dice2)
      }
    }

    window.addEventListener("ai-dice-roll", handleAIRoll)

    return () => {
      window.removeEventListener("ai-dice-roll", handleAIRoll)
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      if (stabilizationIntervalRef.current) {
        clearInterval(stabilizationIntervalRef.current)
      }
    }
  }, [currentPlayerIndex, players])

  useEffect(() => {
    // Expose the dice rolling function to the window object
    window.rollDice = () => {
      return new Promise((resolve, reject) => {
        if (isRolling || isStabilizing || isAITurn()) {
          reject(new Error("Dice are already rolling or it's AI's turn"))
          return
        }

        console.log("Rolling dice from window.rollDice...")
        setIsRolling(true)
        setRollComplete(false)
        setAiRollMessage("")
        setDebugInfo("")
        setStabilizationTimer(0)
        setPendingRollResult(null)

        // Reset previous values
        setDice1Value(null)
        setDice2Value(null)
        completedDiceRef.current = { dice1: false, dice2: false }

        // Clear previous timeouts and intervals
        if (timeoutRef.current) clearTimeout(timeoutRef.current)
        if (stabilizationIntervalRef.current) clearInterval(stabilizationIntervalRef.current)

        // Roll the dice
        if (dice1Ref.current && dice1Ref.current.roll) dice1Ref.current.roll()
        if (dice2Ref.current && dice2Ref.current.roll) dice2Ref.current.roll()

        // Set a timeout to resolve the promise when the roll is complete
        const checkRollComplete = setInterval(() => {
          if (pendingRollResult) {
            clearInterval(checkRollComplete)
            resolve(pendingRollResult)
          }
        }, 100)

        // Safety timeout
        timeoutRef.current = setTimeout(() => {
          clearInterval(checkRollComplete)
          if (isRolling && !rollComplete && !isStabilizing) {
            const randomDice1 = Math.floor(Math.random() * 6) + 1
            const randomDice2 = Math.floor(Math.random() * 6) + 1
            const sum = randomDice1 + randomDice2
            const isDoubles = randomDice1 === randomDice2

            resolve({ sum, isDoubles })

            if (dice1Ref.current && dice1Ref.current.forceResult) dice1Ref.current.forceResult(randomDice1)
            if (dice2Ref.current && dice2Ref.current.forceResult) dice2Ref.current.forceResult(randomDice2)
          }
        }, 8000)
      })
    }

    return () => {
      // Clean up when component unmounts
      delete window.rollDice
    }
  }, [isRolling, isStabilizing, isAITurn])

  const currentPlayer = players[currentPlayerIndex]
  const isAI = isAITurn()

  return (
    <group>
      {/* Dice 1 - red */}
      <PreciseDice ref={dice1Ref} position={[-1.5, 1, 0]} onRollComplete={handleDice1Complete} diceId={1} color="red" />

      {/* Dice 2 - blue */}
      <PreciseDice ref={dice2Ref} position={[1.5, 1, 0]} onRollComplete={handleDice2Complete} diceId={2} color="blue" />

      {/* Roll button and result display - now truly horizontal on the board */}
      <Html position={[0, 0.3, 3]} rotation={[0, 0, 0]} transform>
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            width: "400px",
            padding: "10px",
            backgroundColor: "rgba(255, 255, 255, 0)",
            borderRadius: "8px",
          }}
        >
          <div className="w-14 h-14 bg-red-600 rounded-lg flex items-center justify-center text-white text-3xl font-bold shadow-lg">
            {dice1Value !== null ? dice1Value : "-"}
          </div>
          <div className="text-2xl font-bold mx-3">+</div>
          <div className="w-14 h-14 bg-blue-600 rounded-lg flex items-center justify-center text-white text-3xl font-bold shadow-lg">
            {dice2Value !== null ? dice2Value : "-"}
          </div>
          <div className="text-2xl font-bold mx-3">=</div>
          <div className="w-14 h-14 bg-green-600 rounded-lg flex items-center justify-center text-white text-3xl font-bold shadow-lg">
            {dice1Value !== null && dice2Value !== null ? dice1Value + dice2Value : "-"}
          </div>
        </div>
      </Html>
    </group>
  )
}
