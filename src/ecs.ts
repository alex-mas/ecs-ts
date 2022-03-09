export type Component<Payload extends object = {}> = Payload & {
    $$type: string
}

export type Entity<Payload extends object = {}> = Payload & { id: string };

export type Event<Payload extends object = any> = Payload & {
    type: string,
    stopped?: boolean
}

export type System<Ev extends Event, EPayload extends object = {}> = (entities: Entity<EPayload>[], event: Ev, world: World) => void

export type RegisteredSystem<Ev extends Event = Event<any>> = {
    execute: System<Ev, any>,
    eventSubscription: string,
    priority: number
}

export class World<EntityPayloads extends object = any> {
    entities: Entity<EntityPayloads>[] = [];
    systems: RegisteredSystem<any>[] = [];
    registerSystem = <Ev extends Event>(sys: System<Ev, EntityPayloads>, event: string, priority: number = 1) => {
        const registeredSystem = {
            priority,
            execute: sys,
            eventSubscription: event
        };
        this.systems.push(registeredSystem);
        return this;
    }
    createEventChain = (event: string) => {
        const systems: RegisteredSystem<any>[] = [];
        const chainCreator = {
            addSystem: <Ev extends Event>(sys: System<Ev,EntityPayloads>) => {
                systems.push({
                    priority: systems.length,
                    execute: sys,
                    eventSubscription: event

                });
                return chainCreator;
            },
            register: () => {
                systems.forEach((s) => s.priority = systems.length - s.priority);
                this.systems = this.systems.concat(systems);
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
    clear = ()=>{
        this.systems = [];
        this.entities = [];
        return this;
    }
}


/*
Returns a subset of entities that ensures that components with matching types to each of the value of 
requiredComponents can be found on the entity.
*/
export const filterEntitiesByComponents = <T extends ReadonlyArray<string>>(entities: Entity<any>[], requiredComponents: T): Entity<{ [K in (T extends ReadonlyArray<infer U> ? U : never)]: any }>[] => {
    return entities.filter(
        (entity) => requiredComponents.every((rc) =>Object.entries(entity).find((k,c)=>(k as Component<any>)[1].$$type == rc))
    ) as Entity<{ [K in (T extends ReadonlyArray<infer U> ? U : never)]: any }>[];
}


/*
Returns a subset of entities that have the specified strings as keys. (Assumes the component type can be deduced from the key of the entity)
*/
export const filterEntitiesByKeys= <T extends ReadonlyArray<string>>(entities: Entity<any>[], requiredComponents: T): Entity<{ [K in (T extends ReadonlyArray<infer U> ? U : never)]: any }>[] => {
    return entities.filter(
        (entity) => requiredComponents.every((rc) => !!(Object.keys(entity) as unknown as T).find((k) => k === rc))
    ) as Entity<{ [K in (T extends ReadonlyArray<infer U> ? U : never)]: any }>[];
}


export const regularSystem = <Ev extends Event, T extends ReadonlyArray<string>>(sys: System<Ev, { [K in (T extends ReadonlyArray<infer U> ? U : never)]: any }>, requiredComponents: T) => {
    return (entities: Entity[], event: Ev, world: World) => {
        const relevantEntities = filterEntitiesByComponents(entities, requiredComponents);
        sys(relevantEntities, event, world);
    }
}