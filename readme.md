# About

ecs-ts is an unopinionated library that provides utilities to build [entity component systems](https://en.wikipedia.org/wiki/Entity_component_system). It has no dependencies and since its built on typescript it provides the safety of types when it is possible. 


# Getting Started

Install the package via npm
```sh
npm install @axc/ecs-ts
```
or

```sh
yarn add @axc/ecs-ts
```

# Concepts

## Component

A component is just data, it can be anything from a string, number or boolean to an object. Think of it like a feature. Like Health or Movement

An hipotetic example of a Health component creator.

```js

const createHealthComponent = (maximum, current)=>{
  return {
    $$type: 'HEALTH_COMPONENT',
    $$entityId: 1,
    current,
    maximum
  }
}

```

## Entity

An entity is an ID, usually a number or a string. It must be unique within an ECS World. Geting Entity  data is a common operation, this library provides some utilities, for example: 
```js

//get all entity components
const entity = getEntity(id, world.components);

```

## System

A system is a function that performs some operations on some components when the event it listens to is dispatched.

```js
const system = (event, world)=>{
    for(let entity in entities){
        //do some work
    }
}

```
Common System fetching can be abstarcted via Higher Order Functions, for example, a common use case is to only iterate on components of a certain type


## World

The world holds all the data required for a simulation to run, that is, the entities and the systems. On top of that, its api allows you to dispatch events that are listened by your systems.


## A simple demo

Bringing everything together

```js
import {World} from '@axc/ecs-ts';

const world = new World();

const counterComponent = {
    $$type: 'Counter',
    $$entityId: 1
    count: 0
};

world.registerComponentType('Counter');

world.addComponent(counterComponent);

world
  .createEventChain('periodic')
  .addSystem((entities,world)=>{
    const counters = world.components.get('Counter');
    counters.forEach((counter)=>{.
      counter.count++;
    })
  })
  .register();

world.dispatch({type: 'periodic',dt: 1000/60});

```


# Documentation
You can see the automatically generated documentation [here](https://alex-mas.github.io/ecs-ts/)


# More information

## Events

While the dispatching of events is built into the world, you have two options:

- You can represent application specific events as entities, and only dispatch periodic events, letting the systems take care of it by filtering the components.
- You can dispatch the application specific events themselves and setup the systems to listen to the events

In the end both ways allow for intercepting and modifying the events, for example, an armor systems that detects damage events and reduces its amount.

## Component complexity

Try to minimize the complexity of the components, chances are that if a component is getting complex it could be better represented as an entity and its features broken into their own components. In the end this will result in more flexibility and easier code to read/maintain.


## System runner

When an event is dispatched, the execution graph created by registering an event chain is walked, and systems are executed asynchronously in parallel when possible but respecting the order specified. 
By default, the runner doesn't allow parallelizing, as all the systems run on the main thread, however custom runners can be implemented to leverage multithreading capabilities via workers.