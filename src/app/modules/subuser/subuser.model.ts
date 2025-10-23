/* eslint-disable @typescript-eslint/no-this-alias */

import { Schema, model } from "mongoose";
import { ISubuser, SubuserModel } from "./subuser.interface";
import bcrypt from "bcrypt";
import config from "../../config";

const subuserSchema = new Schema<ISubuser>(
  {
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
    },
    role: {
      type: String,
      required: [true, "Role is required"],
      default: "MODERATOR",
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
      select: 0,
    },
    permissions: {
      type: [String],
      default: [],
      validate: {
        validator: function (permissions: string[]) {
          // Validate that each permission follows the format "MenuName:Permission"
          return permissions.every((permission) => {
            const [menu, action] = permission.split(":");
            return menu && action && ["Read", "Write"].includes(action);
          });
        },
        message:
          'Permissions must be in format "MenuName:Permission" where Permission is Read or Write',
      },
    },
    wholesaler: {
      type: Schema.Types.ObjectId,
      ref: "Wholesaler",
      required: [true, "Wholesaler is required"],
    },
    
  },
  {
    timestamps: true,
  }
);

// Pre save middleware / hook : will work on create()  save()
subuserSchema.pre("save", async function (next) {
  // eslint-disable-next-line @typescript-eslint/no-this-alias
  const subuser = this; // doc
  // hashing password and save into DB

  if (subuser.isModified("password")) {
    subuser.password = await bcrypt.hash(
      subuser.password,
      Number(config.bcrypt_salt_rounds)
    );
  }
  next();
});

// Static method to check if subuser exists
subuserSchema.statics.isSubuserExist = async function (email: string) {
  return await Subuser.findOne({ email }).select("+password");
};

// Static method to check if password matches
subuserSchema.statics.isPasswordMatched = async function (
  givenPassword: string,
  savedPassword: string
): Promise<boolean> {
  return await bcrypt.compare(givenPassword, savedPassword);
};

const Subuser = model<ISubuser, SubuserModel>("Subuser", subuserSchema);

export default Subuser;
