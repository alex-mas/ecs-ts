import {World} from '../../src/ecs';
import { createDummy } from './entities/dummy';
import { ComponentType } from './components/componentType';
import { EventType } from './eventType';
import { dummySystem } from './systems/dummySystem';

const world: World<ComponentType, EventType> = new World();

world.entities.push(createDummy('1',50,10));
world.entities.push(createDummy('2',50,10));

world.registerSystem(dummySystem,EventType.PERIODIC);

world.dispatch({type: EventType.PERIODIC,dt: 1000/60});