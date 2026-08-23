export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; message: string };

export type ActionState<T> = ActionResult<T>;