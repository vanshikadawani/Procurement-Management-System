import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export let UserRole = /*#__PURE__*/function (UserRole) { UserRole["USER"] = "USER"; UserRole["MANAGER"] = "MANAGER"; UserRole["ADMIN"] = "ADMIN"; return UserRole; }({});

const UserSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: Object.values(UserRole), default: UserRole.USER }
}, { timestamps: true });

UserSchema.pre('save', function (next) {
  const user = this;
  if (!user.isModified('password')) return next();
  bcrypt.genSalt(10, (err, salt) => {
    if (err) return next(err);
    bcrypt.hash(user.password, salt, (err, hash) => {
      if (err) return next(err);
      user.password = hash;
      next();
    });
  });
});

UserSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

export default mongoose.model('User', UserSchema);