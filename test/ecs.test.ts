import { System, World } from "../src/ecs";

const PERIODIC = 'periodic';
const createPeriodicEvent = (dt: number) => {
    return { type: PERIODIC, stopped: false, dt };
}
type PeriodicEvent = ReturnType<typeof createPeriodicEvent>;

const world = new World();

beforeEach(() => {
    world.clear();
});



test('Systems are added to the world properly when registering a chain', () => {
    const aSystem: System<PeriodicEvent, { x: number }> = (entities, event, world) => {
        const entity = entities[0];
        entity.x = 2;
    };
    const bSystem: System<PeriodicEvent, { x: number }> = (entities, event, world) => {
        const entity = entities[0];
        entity.x = 3;
    };
    world.createEventChain(PERIODIC)
        .addSystem(aSystem)
        .addSystem(bSystem)
        .register();
    expect(world.systems.length).toBe(2);
});

test('Systems get properly executed when the appropiate event is dispatched', () => {
    const system: System<PeriodicEvent, { x: number }> = (entities, event, world) => {
        const entity = entities[0];
        entity.x += 1;
    };
    const entity = {
        id: 1,
        x: 0
    };
    world.entities.push(entity);
    world.registerSystem(system, PERIODIC);
    world.dispatch(createPeriodicEvent(0));
    expect(entity.x).toBe(1);
});

test('Systems get executed respecting the priority', () => {
    const aSystem: System<PeriodicEvent, { x: number }> = (entities, event, world) => {
        const entity = entities[0];
        entity.x = 2;
    };
    const bSystem: System<PeriodicEvent, { x: number }> = (entities, event, world) => {
        const entity = entities[0];
        entity.x = 3;
    };
    const entity = {
        id: 1,
        x: 1
    };
    world.entities.push(entity);
    world.createEventChain(PERIODIC)
        .addSystem(aSystem)
        .addSystem(bSystem)
        .register();
    world.dispatch(createPeriodicEvent(0));
    expect(entity.x).toBe(3);
});

test('Systems ignore events they were not registered for', () => {
    const system: System<PeriodicEvent, { x: number }> = (entities, event, world) => {
        const entity = entities[0];
        entity.x += 1;
    };
    const entity = {
        id: 1,
        x: 0
    };
    world.entities.push(entity);
    world.registerSystem(system, PERIODIC);
    world.dispatch({ type: 'not periodic', stopped: false });
    expect(entity.x).toBe(0);
});



