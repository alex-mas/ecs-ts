export type Component<ComponentEnum,ComponentType extends ComponentEnum, T extends object= {}> = T & {
    $$type: ComponentType
}
export type Event<EventEnum,Type extends EventEnum,Payload extends object = {}, > = Payload & {
    type: Type
}

export type Entity<ComponentEnum> = Component<ComponentEnum, ComponentEnum>[];

export type MappedEntity<ComponentEnum> = {[key in keyof ComponentEnum]: any};

export type System<ComponentEnum,EventEnum, Ev extends Event<EventEnum, any>,Entities = MappedEntity<ComponentEnum>, DataEntities = MappedEntity<ComponentEnum>> = {
    execute: (entities: Entities[], dataEntities: DataEntities[], ecs: ECSAPI<EventEnum>,event: Ev) => void,
    eventSubscriptions: EventEnum[],
    requiredComponents: ComponentEnum[],
    requiredData: ComponentEnum[],
    priority: number
}

export interface ECSAPI<EventEnum> {
    dispatch: <EventType extends EventEnum, Ev extends Event<EventEnum, any>>(event: Ev) => void,
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
                (entity) => s.requiredComponents.every((rc) => !!entity.find((c)=>c.$$type === rc))
            );
            const mappedEnditites  =  entities.map(convertArrayOfComponentsToDictionary);

            let dataEntities = this.entities.filter(
                (entity) => entity.every((c) => s.requiredData.indexOf(c.$$type) > -1)
            );
            const mappedDataEntities = dataEntities.map(convertArrayOfComponentsToDictionary);
            let exec = s.execute;
            s.execute(mappedEnditites,mappedDataEntities,this,event);
        });
    }
}





const convertArrayOfComponentsToDictionary = <ComponentEnum>(e: Entity<ComponentEnum>): MappedEntity<ComponentEnum>=>{
    let o: MappedEntity<ComponentEnum> = {} as any;
    
    e.forEach((c)=>{
        //@ts-ignore
        o[c.$$type] = c;
    });
    return o;
};