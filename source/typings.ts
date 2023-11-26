/**
 * Takes a type `T` and expands it into an object type with the same properties as `T`.
 *
 * @param T - The type to be expanded.
 *
 * @see {@link https://stackoverflow.com/a/69288824/62937 Source}
 */
export type Expand<T> = T extends infer O ? { [K in keyof O]: O[K] } : never;

/**
 * Takes a union type `U` and transforms it into an intersection type.
 *
 * @param U - The union type to be transformed.
 */
export type UnionToIntersection<U> = (
  U extends unknown ? (arg: U) => 0 : never
) extends (arg: infer I) => 0 ? I
  : never;

/**
 * Takes a union type `U` and extracts the last type in the union.
 *
 * @param U - The union type from which to extract the last type.
 */
export type LastInUnion<U> = UnionToIntersection<
  U extends unknown ? (x: U) => 0 : never
> extends (x: infer L) => 0 ? L
  : never;

/**
 * Takes a union type `U` and transforms it into a tuple type.
 *
 * @param U - The union type to be transformed into a tuple.
 */
export type UnionToTuple<U, Last = LastInUnion<U>> = [U] extends [never] ? []
  : [...UnionToTuple<Exclude<U, Last>>, Last];

/**
 * Takes a type `T` and removes the `undefined` type from its properties.
 *
 * @param T - The type from which to remove `undefined`.
 */
export type RemoveUndefined<T> = [T] extends [undefined] ? T
  : Exclude<T, undefined>;

/**
 * Takes an object type `T` and transforms it into an array of key-value pairs,
 * where each value has `undefined` removed.
 *
 * @param T - The object type from which to extract key-value pairs.
 */
export type ObjectEntries<T> = {
  [K in keyof T]-?: [K, RemoveUndefined<T[K]>];
}[keyof T];

/**
 * Takes a string `S` and replaces all occurrences of substring `From` with substring `To`.
 *
 * @param S - The string in which to perform replacements.
 * @param From - The substring to be replaced.
 * @param To - The substring to replace occurrences of `From`.
 */
export type ReplaceAll<
  S extends string,
  From extends string,
  To extends string,
> = From extends "" ? S
  : S extends `${infer R1}${From}${infer R2}`
    ? `${R1}${To}${ReplaceAll<R2, From, To>}`
  : S;
