export type Component<ComponentEnum,ComponentType, T extends object= {}> = T & {
    $$type: ComponentType
}
export type Event<EventEnum, EventType extends EventEnum,Payload extends object = {}, > = Payload & {
    type: EventType
}

export type Entity<ComponentEnum> = Component<ComponentEnum, any>[];

export type System<ComponentEnum,EventEnum, EventType extends EventEnum ,Entities = Component<ComponentEnum, any>[], DataEntities = Component<ComponentEnum, any>[], > = {
    execute: (entities: Entities[], dataEntities: DataEntities[], ecs: ECSAPI<EventEnum>,event: Event<EventEnum,EventType>) => void,
    eventSubscriptions: EventEnum[],
    requiredComponents: ComponentEnum[],
    requiredData: ComponentEnum[],
    priority: number
}

export interface ECSAPI<EventEnum> {
    dispatch: <EventType extends EventEnum, Ev extends Event<EventEnum, EventType>>(event: Ev) => void,
}
/**
 * 
 * @usage 
 *  Simply instantiate an ECS with your custom enumerations, and push systems and entities to it
 * 
 * @example
 * 
 * enum EventType{
 *  PERIODIC = "periodic"
 * }
 * 
 * enum ComponentType{
 *    HEALTH = "health",
 *    MOVEMENT = "movement"
 *  
 * }
 * 
 * const ecs = new ECS<ComponentType, EventType>();
 * 
 * ecs.systems.push(movementSystem);
 * 
 * ecs.dispatch({
 *  type: EventType.PERIODIC,
 *  dt: 1000/60
 * })
 * 
 * 
 */
export class ECS<ComponentEnum,EventEnum> implements ECSAPI<EventEnum> {
    entities: Entity<ComponentEnum>[] = [];
    systems: System<ComponentEnum, EventEnum,any>[] = [];
    dispatch = <EventType extends EventEnum, Ev extends Event<EventEnum, EventType>>(event: Ev) => {
        const systemsToExecute = this.systems.filter(
            (system) => system.eventSubscriptions.indexOf(event.type) > -1
        ).sort((a, b) => b.priority - a.priority);
        systemsToExecute.forEach((s) => {
            let entities = this.entities.filter(
                (entity) => entity.every((c) => s.requiredComponents.indexOf(c.$$type) > -1)
            );

            let dataEntities = this.entities.filter(
                (entity) => entity.every((c) => s.requiredData.indexOf(c.$$type) > -1)
            );
            let exec = s.execute;
            s.execute(entities,dataEntities,this,event);
        });
    }
}



