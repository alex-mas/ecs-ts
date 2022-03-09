import { createHealthComponent } from "../components/health";
import { createAttackComponent } from "../components/attack";
import { ComponentType } from "../components/componentType";
import { Entity } from "../../../src/ecs";



export const createDummy = (id: string,healthAmmount: number, attackAmmount: number)=>{
    const health = createHealthComponent(healthAmmount, healthAmmount);
    const attack = createAttackComponent(attackAmmount, 1000);
    return {
        id,
        health,
        attack
    }
}
export type DummyType = ReturnType<typeof createDummy>;
const t = createDummy('1',10,10);

