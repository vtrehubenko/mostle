export function validateOrder(userOrder: string[], correctOrder: string[]) {
  const perIndex = userOrder.map((id, i) => id === correctOrder[i]);
  return { correct: perIndex.every(Boolean), perIndex };
}
