import { createAttackComponent } from "../components/attack";
import { createHealthComponent } from "../components/health";


export const createDummy = (id: string,healthAmmount: number, attackAmmount: number)=>{
  const health = createHealthComponent(id, healthAmmount, healthAmmount);
  const attack = createAttackComponent(id, attackAmmount, 1000);
  return [health, attack] as const;
}
export type DummyType = ReturnType<typeof createDummy>;
const t = createDummy('1',10,10);

