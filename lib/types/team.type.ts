import { ILogo } from "./logo.type";

export type ITeam = {
  _id: string;
  name: string;
  teamLogo: ILogo;
  categoryName: string;
  shortname?: string;
}