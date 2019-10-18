import { createHealthComponent } from "../components/health";
import { createAttackComponent } from "../components/attack";
import { ComponentType } from "../components/componentType";
import { Entity } from "../../../src/ecs";

export const createDummy = (id: string,healthAmmount: number, attackAmmount: number): Entity<ComponentType.ATTACK | ComponentType.HEALTH>=>{
    const health = createHealthComponent(healthAmmount, healthAmmount);
    const attack = createAttackComponent(attackAmmount, 1000);
    return {
        id,
        health,
        attack
    }
}


const t = createDummy('1',10,10);

