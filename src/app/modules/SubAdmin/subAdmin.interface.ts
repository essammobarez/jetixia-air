import { Model } from "mongoose";

export interface ISubadmin {
  firstName:string;
  lastName:string;
  email: string;
  password: string;
  role: 'SUBADMIN';
  categories: ('Operation' | 'Technical' | 'Finance' | 'Sales')[];
  isActive?: boolean;
}

export type SubadminModel = Model<ISubadmin> & {
  isSubadminExist(email: string): Promise<ISubadmin | null>;
  isPasswordMatched(givenPassword: string, savedPassword: string): Promise<boolean>;
};
