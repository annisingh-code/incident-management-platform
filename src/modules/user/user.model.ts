import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcrypt';
import { IUser } from './user.interface';

const organizationMembershipSchema = new Schema(
  {
    organization: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
    },
    role: {
      type: String,
      enum: ['Admin', 'Manager', 'Developer'],
      required: true,
    },
  },
  { _id: false }
);

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
      select: false, // Don't return password by default
    },
    currentOrganization: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      default: null,
    },
    organizations: {
      type: [organizationMembershipSchema],
      default: [],
    },
    refreshToken: {
      type: String,
      select: false, // Don't return refreshToken by default
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to hash password before saving
userSchema.pre('save', async function (next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(this.password as string, salt);
    this.password = hashedPassword;
    next();
  } catch (error: any) {
    next(error);
  }
});

// Method to check if password matches
userSchema.methods.isPasswordMatch = async function (password: string): Promise<boolean> {
  return bcrypt.compare(password, this.password as string);
};

export const User = mongoose.model<IUser>('User', userSchema);
