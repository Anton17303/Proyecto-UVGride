export const localISODate = (d: Date = new Date()) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString().slice(0, 10);

export const daysDiff = (aISO: string, bISO: string) => {
  const a = new Date(aISO);
  const b = new Date(bISO);
  const MS = 24 * 60 * 60 * 1000;
  return Math.round((b.getTime() - a.getTime()) / MS);
};
