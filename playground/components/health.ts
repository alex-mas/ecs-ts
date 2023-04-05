import { ComponentType } from "./componentType";

export interface HealthComponentData {
  maximum: number,
  current: number
}

export const createHealthComponent = (ownerId: string, initial: number, maximum: number) => {
  return {
    $$type: ComponentType.HEALTH,
    $$entityId: ownerId,
    current: initial,
    maximum
  }
}

export type HealthComponent = ReturnType<typeof createHealthComponent>;