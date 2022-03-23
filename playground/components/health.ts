import { ComponentType } from "./componentType"

export interface HealthComponentData {
    maximum: number,
    current: number
}

export const createHealthComponent = (initial: number, maximum: number)=>{
    return {
        $$type: ComponentType.HEALTH,
        current: initial,
        maximum
    }
}

export type HealthComponent = ReturnType<typeof createHealthComponent>;