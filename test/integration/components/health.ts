import { ComponentType } from "./componentType"
import {Component} from '../../../src/ecs';
import { EventType } from "../eventType";

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