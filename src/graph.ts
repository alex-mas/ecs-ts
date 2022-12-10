

export type DirectedGraphNode<T> = {
  value: T
  children: number[],
  parents: number[]
}


export type DirectedGraph<T> = DirectedGraphNode<T>[];



export const createGraphNode = <T>(value: T, parents: number[] = [], children: number[] = []) => {
  return {
    value,
    children,
    parents
  }
}
export const createGraph = <T>(...initialValues: T[]): DirectedGraph<T> => {
  return initialValues.map((v) => createGraphNode(v));
}
export const addNode = <T>(value: T, parents: number[] | number, graph: DirectedGraph<T>) => {
  const len = graph.length;
  if (typeof parents === 'number') {
    graph[parents].children.push(len);
    graph.push(createGraphNode(value, [parents]));
    return graph;
  }
  parents.forEach((parent) => {
    graph[parent].children.push(len);
  });
  graph.push(createGraphNode(value, parents));
  return graph;
}


export const removeNode = <T>(index: number | T, graph: DirectedGraph<T>, removeNewOrphans: boolean = true) => {
  let actualIndex = index as number;
  if (typeof index !== 'number') {
    actualIndex = graph.findIndex((v) => v.value === index);
  }
  let orphanNodes: number[] = [];
  let newGraph = graph.map((node, i) => {
    if (i === actualIndex) {
      return undefined;
    }
    const newParents = node.parents.filter((parent) => parent !== actualIndex).map((p) => p >= actualIndex ? p-- : p);
    if (newParents.length === 0 && node.parents.length > 0) {
      orphanNodes.push(i > actualIndex ? i - 1 : i);
    }
    return createGraphNode(
      node.value,
      newParents,
      node.children.filter((child) => child !== actualIndex).map((child) => child >= actualIndex ? actualIndex-- : child)
    )
  }).filter((v) => !!v) as DirectedGraph<T>;
  if (removeNewOrphans) {
    orphanNodes.forEach((node) => {
      newGraph = removeNode(node, newGraph, true);
    })
  }
  return newGraph;
}