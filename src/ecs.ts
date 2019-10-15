
export type Component<ComponentEnum,ComponentType extends ComponentEnum, T extends object= {}> = T & {
    $$type: ComponentType
}
//export type Entity<ComponentEnum> = Component<ComponentEnum, ComponentEnum>[];
export type Entity<ComponentEnum> = {
    [key in keyof ComponentEnum]: any
} & {id?: string}; 


export type Event<Type,Payload extends object = {}, > = Payload & {
    type: Type
}

export type System<ComponentEnum, EventEnum,Ev > = (entities: Entity<ComponentEnum>[],event: Ev,world: World<ComponentEnum,EventEnum>) => void

export type RegisteredSystem<ComponentEnum,EventEnum, Ev = Event<EventEnum, any>> = {
    execute:System<ComponentEnum,EventEnum,Ev>,
    eventSubscription: EventEnum,
    priority: number
}

export class World<ComponentEnum, EventEnum> {
    entities: Entity<ComponentEnum>[] = [];
    systems: RegisteredSystem<ComponentEnum, EventEnum, any>[] = [];
    registerSystem = <Ev extends EventEnum>(sys: System<ComponentEnum,EventEnum,any>, event: Ev, priority: number)=>{
        const registeredSystem = {
            priority,
            execute: sys,
            eventSubscription: event
        };
        this.systems.push(registeredSystem);
        return registeredSystem;
    }
    dispatch = <EventType extends EventEnum, Ev extends Event<EventType>>(event: Ev)=>{
        const systemsToExecute = this.systems.filter(
            (system) => system.eventSubscription === event.type
        ).sort((a, b) => b.priority - a.priority);
        systemsToExecute.forEach((s) => {
            s.execute(this.entities,event,this);
        });
        return this;
    }
}


export const filterEntitiesByComponents = <ComponentEnum = any>(entities: Entity<ComponentEnum>[], requiredComponents: ComponentEnum[])=>{
    return entities.filter(
        (entity) => requiredComponents.every((rc) => !!(Object.keys(entity) as unknown as ComponentEnum[]).find((k)=>k === rc))
    );
}

export const regularSystem = <ComponentEnum,EventEnum,Ev>(sys: System<ComponentEnum, EventEnum, Ev>, requiredComponents: ComponentEnum[]): System<ComponentEnum,EventEnum,Ev>=>{
    return (entities: Entity<ComponentEnum>[],event: Ev,world: World<ComponentEnum,EventEnum>)=>{
        const relevantEntities = filterEntitiesByComponents(entities,requiredComponents);
        sys(relevantEntities,event,world);
    }
}
