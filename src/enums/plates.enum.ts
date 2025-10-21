// src/enums/plates.enum.ts
export const Plates = {
    P: "P",
    M: "M",
    A: "A",
    C: "C",
    U: "U",
    O: "O",
    E: "E",
} as const;

export type PlateType = typeof Plates[keyof typeof Plates];

// Ejemplo de uso
// import { Plates } from "@/enums/plates.enum";
// if (plateType === Plates.A) {
//     // lógica para placa tipo A
// }