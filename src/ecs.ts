export type Component<ComponentEnum,ComponentType extends ComponentEnum, T extends object= {}> = T & {
    $$type: ComponentType
}

export type Entity<ComponentEnum extends string | number | symbol> = {
    [key in ComponentEnum]: any
} & {id?: string}; 

export type Event<Type,Payload extends object = {}, > = Payload & {
    type: Type
}

export type System<ComponentEnum extends string, EventEnum,Ev > = (entities: Entity<ComponentEnum>[],event: Ev,world: World<ComponentEnum,EventEnum>) => void

export type RegisteredSystem<ComponentEnum extends string,EventEnum, Ev = Event<EventEnum, any>> = {
    execute:System<ComponentEnum,EventEnum,Ev>,
    eventSubscription: EventEnum,
    priority: number
}

export class World<ComponentEnum extends string, EventEnum> {
    entities: Entity<any>[] = [];
    systems: RegisteredSystem<any, EventEnum, any>[] = [];
    registerSystem = <Ev extends EventEnum,Cp extends ComponentEnum>(sys: System<Cp,EventEnum,any>, event: Ev, priority: number = 1)=>{
        const registeredSystem = {
            priority,
            execute: sys,
            eventSubscription: event
        };
        this.systems.push(registeredSystem);
        return registeredSystem;
    }
    dispatch = <Ev extends Event<EventEnum, any>>(event: Ev)=>{
        const systemsToExecute = this.systems.filter(
            (system) => system.eventSubscription === event.type
        ).sort((a, b) => b.priority - a.priority);
        systemsToExecute.forEach((s) => {
            s.execute(this.entities,event,this);
        });
        return this;
    }
}

export const filterEntitiesByComponents = <ComponentEnum  extends string= any>(entities: Entity<ComponentEnum>[], requiredComponents: ComponentEnum[])=>{
    return entities.filter(
        (entity) => requiredComponents.every((rc) => !!(Object.keys(entity) as unknown as ComponentEnum[]).find((k)=>k === rc))
    );
}

export const regularSystem = <Ev extends Event<EventEnum, any> = {},EventEnum = any,ComponentEnum extends string = any,>(sys: System<ComponentEnum, EventEnum, Ev>, requiredComponents: ComponentEnum[]): System<ComponentEnum,EventEnum,Ev>=>{
    return (entities: Entity<ComponentEnum>[],event: Ev,world: World<ComponentEnum,EventEnum>)=>{
        const relevantEntities = filterEntitiesByComponents(entities,requiredComponents);
        sys(relevantEntities,event,world);
    }
}
