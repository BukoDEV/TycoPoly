import type { Player } from "@/types/game-types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useGameStore } from "@/store/game-store"

interface PlayerPanelProps {
  players: Player[]
  currentPlayerIndex: number
}

export default function PlayerPanel({ players, currentPlayerIndex }: PlayerPanelProps) {
  const { board } = useGameStore()

  const getPlayerProperties = (player: Player) => {
    return player.properties.map((propId) => board.find((field) => field.id === propId)).filter(Boolean)
  }

  return (
    <div className="space-y-4">
      {players.map((player, index) => (
        <Card
          key={player.id}
          className={`${index === currentPlayerIndex ? "ring-2 ring-offset-2" : ""}`}
          style={{
            borderColor: player.color,
            ringColor: player.color,
          }}
        >
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: player.color }} />
                {player.name}
              </CardTitle>
              {index === currentPlayerIndex && (
                <Badge variant="outline" className="bg-green-100 dark:bg-green-900">
                  Aktualny ruch
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="font-medium">Pieniądze:</span>
                <span className="font-bold">{player.money}$</span>
              </div>

              <div>
                <span className="font-medium">Nieruchomości:</span>
                {player.properties.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Brak nieruchomości</p>
                ) : (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {getPlayerProperties(player).map((property) => (
                      <Badge key={property.id} style={{ backgroundColor: property.color }} className="text-white">
                        {property.name}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {player.inJail && <Badge variant="destructive">W więzieniu</Badge>}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
