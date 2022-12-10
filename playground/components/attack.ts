import { ComponentType } from "./componentType";

export interface AttackComponentData {
  amount: number,
  speed: number
}

export const createAttackComponent = (ownerId: string, ammount: number, speed: number) => {
  return {
    $$type: ComponentType.ATTACK,
    $$ownerId: ownerId,
    ammount,
    speed
  }
}
export type AttackComponent = ReturnType<typeof createAttackComponent>;