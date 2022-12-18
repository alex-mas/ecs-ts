import { getComponents, getEntity, queryArchetype, queryEntities, World } from "../src/ecs";



const PERIODIC = 'periodic';
const createPeriodicEvent = (dt: number) => {
  return { type: PERIODIC, stopped: false, dt };
}
type PeriodicEvent = ReturnType<typeof createPeriodicEvent>;

let world = new World<string, number>();
let components: any[] = [];

const createPositionComponent = (eId: number) => {
  return {
    $$entityId: eId,
    $$type: 'position',
    x: 0,
    y: 0
  }
}
const createHealthComponent = (eId: number) => {
  return {
    $$entityId: eId,
    $$type: 'health',
    value: 0
  }
}


const unitArchetype = ['health', 'position'];
const healthArchetype = ['health'];
const positionArchetype = ['position'];
beforeEach(() => {
  world = new World<string, number>();
  world.registerComponentType('position');
  world.registerComponentType('health');
  world.registerArchetype(unitArchetype);
  world.registerArchetype(healthArchetype);
  world.registerArchetype(positionArchetype);
  components = [];
  for (let i = 0; i < 1000000; i++) {
    const pos = createPositionComponent(i);
    const hp = createHealthComponent(i);
    components.push(pos);
    components.push(hp);
  }
});


test('Adding components for entity', () => {
  const before = Date.now();
  for (let i = 0; i < 10000000; i++) {
    const cp = createPositionComponent(0);
    world.addComponent(cp);
  }

  const diff = Date.now() - before;
  console.log(`Mesured ms performance for 10M cp aditions to 1 entity: ${diff / 10000000}`);
});


test('Adding components for new entities', () => {
  const before = Date.now();
  for (let cp of components) {
    world.addComponent(cp);
  }
  const diff = Date.now() - before;
  console.log(`Mesured ms performance for 2M cp aditions: ${diff}`);
});


test('Get entity performance', () => {
  for (let cp of components) {
    world.addComponent(cp);
  }
  const before = Date.now();
  for (let i = 0; i < 1000000; i++) {
    const entity = getEntity(i, world.components);
  }
  const diff = Date.now() - before;

  console.log(`Mesured ms performance for 1M getEntity operations: ${diff}`);
});


test('Get entity specifying components performance', () => {
  for (let cp of components) {
    world.addComponent(cp);
  }
  const before = Date.now();
  for (let i = 0; i < 1000000; i++) {
    const entity = getEntity(i, world.components, positionArchetype);
  }
  const diff = Date.now() - before;

  console.log(`Mesured ms performance for 1M getEntity operations: ${diff}`);
});



test('Get components performance', () => {
  for (let cp of components) {
    world.addComponent(cp);
  }
  const before = Date.now();
  for (let i = 0; i < 1000000; i++) {
    const cp = getComponents(i, 'health', world.components);
  }
  const diff = Date.now() - before;

  console.log(`Mesured ms performance for 1M getComponents operations: ${diff}`);
  expect(diff).toBeLessThan(100);
});



test('query entities performance', () => {
  for (let cp of components) {
    world.addComponent(cp);
  }
  const before = Date.now();
  for (let i = 0; i < 50; i++) {
    const entities = queryEntities(unitArchetype, world);
  }
  const diff = Date.now() - before;

  console.log(`Average ms performance for queryEntities operation: ${diff / 50}`);
  expect(diff / 50).toBeLessThan(400);
});

test('query archetype performance', () => {
  for (let cp of components) {
    world.addComponent(cp);
  }
  const before = Date.now();
  for (let i = 0; i < 50; i++) {
    const entities = queryArchetype(healthArchetype, world);
  }
  const diff = Date.now() - before;

  console.log(`Average ms performance for queryArchetype operation: ${diff / 50}`);
  expect(diff / 50).toBeLessThan(400);
});


