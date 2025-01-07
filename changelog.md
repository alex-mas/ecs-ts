

## 0.11.0 Changes
- Renamed ECS to World
- Istead of pre-assembling a system user now passes the system, its priority and the event it subscribes to to the addSystem method
- Changed type signatures to require less generic arguments

## 0.12.0 Changes
- Simplified the generics api

## 0.12.3 Changes
- Id is no longer an optional property of an entity

## 0.12.4 Changes
- Improve types

## 0.12.5 Changes
- Event propagation can now be stopped by setting the event.stopped to true
- Update dependencies
- Improve documentation 

 # 0.13.0 Changes
 - Simplifies typing system to increase inference and improve developer expirience
 - Adds createEventChain method that allows to use a currying pattern to specify systems for a specific event.
 - Breaking: rename filterEntitiesByComponents to filterEntitiesByKeys
 - Breaking: filterEntitiesByComponents now looks for the $$type property of the entities components.

# 0.13.1 Changes
 -  filterEntitiesByComponents now ignores undefined keys on the object.
 -  Added getComponents utility to retrieve components of the entity
 -  Ensures immutability of entities and provices mechanisms for updating the entities


# 0.2.0 Changes
  - Rewrite entity storage, now entities are just id pointers stored in components
  - Add some data structures in the world storing references to speed up fetching operations
  - Execution of systems for a given event now is a dependecy graph, system execution is async and a custom runner can be provided to allow parallelization among others


# 0.2.1 Changes
 - Add the archetype map to speed up getting entity components

# 0.2.1 Changes
- Add regularSystem back

# 0.2.3 Changes
- Fix default system executor infinite loop on certain cases

# 0.2.5 Changes
- update dev dependencies

# 0.2.6 Changes
- Provide TypeMap generic argument for World to better narrow types of components
- Breaking: getEntity takes the ecs world instead of only the components map