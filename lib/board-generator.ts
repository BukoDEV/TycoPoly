import type { Field } from "@/types/game-types"

export function generateBoard(): Field[] {
  const board: Field[] = [
    // Pole startowe
    { id: 0, name: "Start", type: "start" },

    // Brązowe
    { id: 1, name: "Ul. Konopacka", type: "property", price: 60, color: "#8B4513", rent: 2 },
    { id: 2, name: "Kasa Społeczna", type: "community" },
    { id: 3, name: "Ul. Stalowa", type: "property", price: 60, color: "#8B4513", rent: 4 },
    { id: 4, name: "Podatek Dochodowy", type: "tax", price: 200 },
    { id: 5, name: "Dworzec Wschodni", type: "property", price: 200, color: "#000000", rent: 25 },

    // Jasnoniebieskie
    { id: 6, name: "Ul. Radzymińska", type: "property", price: 100, color: "#87CEEB", rent: 6 },
    { id: 7, name: "Szansa", type: "chance" },
    { id: 8, name: "Ul. Targowa", type: "property", price: 100, color: "#87CEEB", rent: 6 },
    { id: 9, name: "Ul. Wileńska", type: "property", price: 120, color: "#87CEEB", rent: 8 },

    // Więzienie
    { id: 10, name: "Więzienie", type: "jail" },

    // Różowe
    { id: 11, name: "Ul. Mickiewicza", type: "property", price: 140, color: "#FF69B4", rent: 10 },
    { id: 12, name: "Elektrownia", type: "property", price: 150, color: "#FFFFFF", rent: 0 },
    { id: 13, name: "Ul. Słowackiego", type: "property", price: 140, color: "#FF69B4", rent: 10 },
    { id: 14, name: "Ul. Krakowska", type: "property", price: 160, color: "#FF69B4", rent: 12 },
    { id: 15, name: "Dworzec Zachodni", type: "property", price: 200, color: "#000000", rent: 25 },

    // Pomarańczowe
    { id: 16, name: "Ul. Płocka", type: "property", price: 180, color: "#FFA500", rent: 14 },
    { id: 17, name: "Kasa Społeczna", type: "community" },
    { id: 18, name: "Ul. Wolska", type: "property", price: 180, color: "#FFA500", rent: 14 },
    { id: 19, name: "Ul. Górczewska", type: "property", price: 200, color: "#FFA500", rent: 16 },

    // Bezpłatny parking
    { id: 20, name: "Bezpłatny Parking", type: "parking" },

    // Czerwone
    { id: 21, name: "Ul. Świętokrzyska", type: "property", price: 220, color: "#FF0000", rent: 18 },
    { id: 22, name: "Szansa", type: "chance" },
    { id: 23, name: "Ul. Nowy Świat", type: "property", price: 220, color: "#FF0000", rent: 18 },
    { id: 24, name: "Ul. Krakowskie Przedmieście", type: "property", price: 240, color: "#FF0000", rent: 20 },
    { id: 25, name: "Dworzec Północny", type: "property", price: 200, color: "#000000", rent: 25 },

    // Żółte
    { id: 26, name: "Ul. Marszałkowska", type: "property", price: 260, color: "#FFFF00", rent: 22 },
    { id: 27, name: "Ul. Aleje Jerozolimskie", type: "property", price: 260, color: "#FFFF00", rent: 22 },
    { id: 28, name: "Wodociągi", type: "property", price: 150, color: "#FFFFFF", rent: 0 },
    { id: 29, name: "Plac Trzech Krzyży", type: "property", price: 280, color: "#FFFF00", rent: 24 },

    // Idź do więzienia
    { id: 30, name: "Idź do więzienia", type: "go-to-jail" },

    // Zielone
    { id: 31, name: "Plac Wilsona", type: "property", price: 300, color: "#008000", rent: 26 },
    { id: 32, name: "Ul. Hoża", type: "property", price: 300, color: "#008000", rent: 26 },
    { id: 33, name: "Kasa Społeczna", type: "community" },
    { id: 34, name: "Aleje Ujazdowskie", type: "property", price: 320, color: "#008000", rent: 28 },
    { id: 35, name: "Dworzec Południowy", type: "property", price: 200, color: "#000000", rent: 25 },

    // Szansa
    { id: 36, name: "Szansa", type: "chance" },

    // Granatowe
    { id: 37, name: "Ul. Belwederska", type: "property", price: 350, color: "#000080", rent: 35 },
    { id: 38, name: "Domiar Podatkowy", type: "tax", price: 100 },
    { id: 39, name: "Plac Zamkowy", type: "property", price: 400, color: "#000080", rent: 50 },
  ]

  return board
}
