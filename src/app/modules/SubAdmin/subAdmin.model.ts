import { Schema, model } from 'mongoose';
import { ISubadmin, SubadminModel } from './subAdmin.interface';

const subadminSchema = new Schema<ISubadmin>(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true, select: 0 },
    role: {
      type: String,
      enum: ['SUBADMIN'],
      default: 'SUBADMIN',
    },
    categories: {
      type: [String],
      enum: ['Operation', 'Technical', 'Finance', 'Sales'],
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// hash password + add statics like subuser

export const Subadmin = model<ISubadmin, SubadminModel>('Subadmin', subadminSchema);