import GameContainer from "@/components/game/game-container"

export default function Home() {
  return (
    <main className="w-screen h-screen bg-gradient-to-b from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900 overflow-hidden">
      <GameContainer />
    </main>
  )
}
