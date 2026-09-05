export function validateTaskGraph(contracts) {
  const byKey = new Map();
  for (const contract of contracts) {
    if (byKey.has(contract.task_key)) {
      throw new Error(`Duplicate task_key: ${contract.task_key}`);
    }
    byKey.set(contract.task_key, contract);
  }
  for (const contract of contracts) {
    for (const dependency of contract.dependencies) {
      if (!byKey.has(dependency)) {
        throw new Error(`Unknown dependency ${dependency} for ${contract.task_key}`);
      }
    }
  }
  const visiting = new Set();
  const visited = new Set();
  function visit(key) {
    if (visiting.has(key)) throw new Error(`Dependency cycle includes ${key}`);
    if (visited.has(key)) return;
    visiting.add(key);
    for (const dependency of byKey.get(key).dependencies) visit(dependency);
    visiting.delete(key);
    visited.add(key);
  }
  for (const key of byKey.keys()) visit(key);
  return byKey;
}

export function dependenciesSatisfied(contract, contractsByKey) {
  return contract.dependencies.every((dependency) => {
    const state = contractsByKey.get(dependency);
    return state?.status === "MERGED" && state?.phase === "COMPLETE";
  });
}

export function taskGraphIdentity(contract) {
  return contract.task_key;
}
