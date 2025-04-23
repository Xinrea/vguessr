import { VTuber } from "./types";
import vtubersData from "./vtubers.json";

export const vtubers: VTuber[] = vtubersData.map((vtuber) => ({
  ...vtuber,
  avatar: vtuber.avatar || "",
  height: Number(vtuber.height),
  age: Number(vtuber.age),
}));
