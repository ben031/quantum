export const isUndefined = (value: any): value is undefined =>
  typeof value === "undefined";

export const isBoolean = (value: any): value is boolean =>
  typeof value === "boolean";
