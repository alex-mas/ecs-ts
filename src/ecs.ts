export type Component<ComponentEnum,ComponentType extends ComponentEnum, T extends object= {}> = T & {
    $$type: ComponentType
}

export type Entity<ComponentEnum extends string | number | symbol> = {
    [key in ComponentEnum]: any
} & {id: string}; 

export type Event<Type,Payload extends object = {}, > = Payload & {
    type: Type,
    stopped: boolean
}

export type System<ComponentEnum extends string, EventEnum,Ev > = (entities: Entity<ComponentEnum>[],event: Ev,world: World<ComponentEnum,EventEnum>) => void

export type RegisteredSystem<ComponentEnum extends string,EventEnum, Ev = Event<EventEnum, any>> = {
    execute:System<ComponentEnum,EventEnum,Ev>,
    eventSubscription: EventEnum,
    priority: number
}

export class World<ComponentEnum extends string, EventEnum> {
    entities: Entity<ComponentEnum>[] = [];
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
    dispatch = <Ev extends Event<EventEnum, {}>>(event: Ev)=>{
        const systemsToExecute = this.systems.filter(
            (system) => system.eventSubscription === event.type
        ).sort((a, b) => b.priority - a.priority);
        systemsToExecute.forEach((s) => {
            if(!event.stopped){
                s.execute(this.entities,event,this);
            }
        });
        return this;
    }
}


export const filterEntitiesByComponents = <ComponentEnumValue extends string= any>(entities: Entity<any>[], requiredComponents: ComponentEnumValue[]): Entity<ComponentEnumValue>[]=>{
    return entities.filter(
        (entity) => requiredComponents.every((rc) => !!(Object.keys(entity) as unknown as ComponentEnumValue[]).find((k)=>k === rc))
    ) as Entity<ComponentEnumValue>[];
}

export const regularSystem = <Ev extends Event<EventEnum, any> = {},EventEnum = any,ComponentEnum extends string = any,>(sys: System<ComponentEnum, EventEnum, Ev>, requiredComponents: ComponentEnum[]): System<ComponentEnum,EventEnum,Ev>=>{
    return (entities: Entity<ComponentEnum>[],event: Ev,world: World<ComponentEnum,EventEnum>)=>{
        const relevantEntities = filterEntitiesByComponents(entities,requiredComponents);
        sys(relevantEntities,event,world);
    }
}
