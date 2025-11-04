// import mongoose, { Schema, Document } from "mongoose";

// export interface IAuthModelConfig extends Document {
//   modelName: string;
//   importPath: string;
//   exportName: string;
//   selectFields: string;
//   statusField: string;
//   statusFieldInverted: boolean;
//   priority: number;
//   isActive: boolean;
//   createdAt: Date;
//   updatedAt: Date;
// }

// const authModelConfigSchema = new Schema<IAuthModelConfig>(
//   {
//     modelName: {
//       type: String,
//       required: true,
//       unique: true,
//     },
//     importPath: {
//       type: String,
//       required: true,
//     },
//     exportName: {
//       type: String,
//       required: true,
//     },
//     selectFields: {
//       type: String,
//       required: true,
//     },
//     statusField: {
//       type: String,
//       required: true,
//     },
//     statusFieldInverted: {
//       type: Boolean,
//       default: false,
//     },
//     priority: {
//       type: Number,
//       required: true,
//     },
//     isActive: {
//       type: Boolean,
//       default: true,
//     },
//   },
//   {
//     timestamps: true,
//   }
// );

// export const AuthModelConfig = mongoose.model<IAuthModelConfig>(
//   "AuthModelConfig",
//   authModelConfigSchema
// );





