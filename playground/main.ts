import { World } from '../src/ecs';
import { ComponentType } from './components/componentType';
import { createDummy } from './entities/dummy';
import { EventType } from './eventType';
import { dummySystem } from './systems/dummySystem';

const world: World = new World();


const [health1, attack1] = createDummy('1', 50, 10);
const [health2, attack2] = createDummy('2', 50, 10);


world.components.set(ComponentType.HEALTH, [health1, health2]);
world.components.set(ComponentType.ATTACK, [attack1, attack2]);

world.createEventChain(EventType.PERIODIC).addSystem(dummySystem).register();


world.dispatch({ type: EventType.PERIODIC, dt: 1000 / 60, stopped: false });

