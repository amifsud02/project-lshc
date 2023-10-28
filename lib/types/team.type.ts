import { ILogo } from "./logo.type";

export type ITeam = {
  _id: string;
  name: string;
  logo: ILogo;
  categoryName: string;
  shortname?: string;
}