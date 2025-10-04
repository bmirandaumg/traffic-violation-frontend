// src/enums/plates.enum.ts
export const Plates = {
    A: "A",
    M: "M",
    U: "U",
    O: "O",
    C: "C",
    E: "E",
    P: "P",
    CD: "CD",
    DT: "DT",
    TC: "TC",
    CC: "CC",
    MI: "MI"
} as const;

export type PlateType = typeof Plates[keyof typeof Plates];

// Ejemplo de uso
// import { Plates } from "@/enums/plates.enum";
// if (plateType === Plates.A) {
//     // lógica para placa tipo A
// }