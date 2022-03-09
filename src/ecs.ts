export type Component<Payload extends object = {}> = Payload & {
    $$type: string
}

export type Entity<Payload extends object = {}> = Payload & { id: string };

export type Event<Payload extends object = any> = Payload & {
    type: string,
    stopped: boolean
}

export type System<Ev extends Event,EPayload extends object = {}> = (entities: Entity<EPayload>[], event: Ev, world: World) => void

export type RegisteredSystem<Ev extends Event = Event<any>> = {
    execute: System<Ev, any>,
    eventSubscription: string,
    priority: number
}

export class World<EntityPayloads extends object = any> {
    entities: Entity<EntityPayloads>[] = [];
    systems: RegisteredSystem<any>[] = [];
    registerSystem = <Ev extends Event>(sys: System<Ev>, event: string, priority: number = 1) => {
        const registeredSystem = {
            priority,
            execute: sys,
            eventSubscription: event
        };
        this.systems.push(registeredSystem);
        return registeredSystem;
    }
    createEventChain =(event: string) => {
        const systems:RegisteredSystem<any>[] = [];
        const chainCreator = {
            addSystem: <Ev extends Event>(sys: System<Ev>) => {
                systems.push({
                    priority: systems.length,
                    execute: sys,
                    eventSubscription: event

                });
                return chainCreator;
            },
            register: ()=>{
                systems.forEach((s)=>s.priority = systems.length - s.priority);
            }
        };
        return chainCreator;
    }
    dispatch = <Ev extends Event<{}>>(event: Ev) => {
        const systemsToExecute = this.systems.filter(
            (system) => system.eventSubscription === event.type
        ).sort((a, b) => b.priority - a.priority);
        systemsToExecute.forEach((s) => {
            if (!event.stopped) {
                s.execute(this.entities, event, this);
            }
        });
        return this;
    }
}


export const filterEntitiesByComponents = <T extends ReadonlyArray<string>>(entities: Entity<any>[], requiredComponents: T): Entity<{[K in (T extends ReadonlyArray<infer U> ? U : never)]: any}>[] => {
    return entities.filter(
        (entity) => requiredComponents.every((rc) => !!(Object.keys(entity) as unknown as T).find((k) => k === rc))
    ) as Entity<{[K in (T extends ReadonlyArray<infer U> ? U : never)]: any}>[];
}

export const regularSystem = <Ev extends Event, T extends ReadonlyArray<string>>(sys: System<Ev,{[K in (T extends ReadonlyArray<infer U> ? U : never)]: any}>, requiredComponents: T) => {
    return (entities: Entity[], event: Ev, world: World) => {
        const relevantEntities = filterEntitiesByComponents(entities, requiredComponents);
        sys(relevantEntities, event, world);
    }
}