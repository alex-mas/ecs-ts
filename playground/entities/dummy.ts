import { createAttackComponent } from "../components/attack";
import { ComponentType } from "../components/componentType";
import { createHealthComponent } from "../components/health";


export const createDummy = (id: string,healthAmmount: number, attackAmmount: number)=>{
  const health = createHealthComponent(id, healthAmmount, healthAmmount);
  const attack = createAttackComponent(id, attackAmmount, 1000);
  return [health, attack];
}
export type DummyType = ReturnType<typeof createDummy>;
const t = createDummy('1',10,10);

export const DummyArchetype = [ComponentType.ATTACK, ComponentType.HEALTH];