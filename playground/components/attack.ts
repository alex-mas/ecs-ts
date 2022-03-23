import { ComponentType } from "./componentType"

export interface AttackComponentData {
    amount: number,
    speed: number
}

export const createAttackComponent = (ammount: number, speed: number)=>{
    return {
        $$type: ComponentType.ATTACK,
        ammount,
        speed
    }
}
export type AttackComponent = ReturnType<typeof createAttackComponent>;