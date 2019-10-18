import { ComponentType } from "./componentType"
import {Component} from '../../../src/ecs';
import { EventType } from "../eventType";

export interface AttackComponentData {
    amount: number,
    speed: number
}
export type AttackComponent = Component<ComponentType,ComponentType.ATTACK, AttackComponentData>;

export const createAttackComponent = (ammount: number, speed: number)=>{
    return {
        $$type: ComponentType.ATTACK,
        ammount,
        speed
    }
}