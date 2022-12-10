import { System, World } from "../src/ecs";

const PERIODIC = 'periodic';
const createPeriodicEvent = (dt: number) => {
  return { type: PERIODIC, stopped: false, dt };
}
type PeriodicEvent = ReturnType<typeof createPeriodicEvent>;

let world = new World();

beforeEach(() => {
  world = new World();
});



test('Systems are added to the world properly when registering a chain', () => {
  const aSystem: System<PeriodicEvent> = ( event, world) => {
    const position = world.components.get('position')
    if(position){
      position[0].x = 2;
    }
  };
  const bSystem: System<PeriodicEvent> = ( event, world) => {
    const position = world.components.get('position')
    if(position){
      position[0].x = 3;
    }
  };
  world.createEventChain(PERIODIC)
    .addSystem(aSystem, [])
    .addSystem(bSystem, [aSystem])
    .register();
  expect(world.systems.get(PERIODIC)?.length ).toBe(2);
});


test('Systems get properly executed when the appropiate event is dispatched', async () => {
  const system: System<PeriodicEvent> = ( event, world) => {
    const position = world.components.get('position')
    if(position){
      position[0].x += 1;
    }
  };
  const positionCp = {
    $$type: 'position',
    $$entityId: 1,
    x: 0
  };
  world.components.set('position', [positionCp]);
  await world.createEventChain(PERIODIC)
    .addSystem(system, [])
    .register()
    .dispatch(createPeriodicEvent(0));
  expect(positionCp.x).toBe(1);
});

test('Systems get executed respecting the priority', async () => {
  const aSystem: System<PeriodicEvent> = ( event, world) => {
    const position = world.components.get('position')
    if(position){
      position[0].x = 2;
    }
  };
  const bSystem: System<PeriodicEvent> = ( event, world) => {
    const position = world.components.get('position')
    if(position){
      position[0].x = 3;
    }
  };
  const positionCp = {
      $$type: 'position',
      $$entityId: 1,
      x: 0
    };
  world.components.set('position', [positionCp]);
  await world.createEventChain(PERIODIC)
    .addSystem(aSystem)
    .addSystem(bSystem)
    .register()
    .dispatch(createPeriodicEvent(0));
  expect(positionCp.x).toBe(3);
});

test('Systems ignore events they were not registered for', async () => {
  const system: System<PeriodicEvent> = ( event, world) => {
    const position = world.components.get('position')
    if(position){
      position[0].x = 2;
    }
  };
  const positionCp = {
    $$type: 'position',
    $$entityId: 1,
    x: 0
  };
  world.components.set('position', [positionCp]);
  await world.createEventChain(PERIODIC)
    .addSystem(system)
    .register()
    .dispatch({ type: 'not periodic'});
  expect(positionCp.x).toBe(0);
});