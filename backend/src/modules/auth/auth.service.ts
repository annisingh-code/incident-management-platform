import jwt from 'jsonwebtoken';
import { User } from '../user/user.model';
import { Invite } from '../invite/invite.model';
import { Organization } from '../organization/organization.model';
import { ApiError } from '../../utils/ApiError';
import { config } from '../../config';

export const generateTokens = (userId: string) => {
  const accessToken = jwt.sign({ id: userId }, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpiresIn as any,
  });

  const refreshToken = jwt.sign({ id: userId }, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn as any,
  });

  return { accessToken, refreshToken };
};

export const signup = async (userData: any) => {
  if (await User.findOne({ email: userData.email })) {
    throw new ApiError(400, 'Email already taken');
  }

  const user = await User.create(userData);

  // Process pending invites
  const pendingInvites = await Invite.find({ email: user.email, status: 'pending' });
  if (pendingInvites.length > 0) {
    for (const invite of pendingInvites) {
      user.organizations.push({
        organization: invite.organizationId,
        role: invite.role as any
      });
      
      if (!user.currentOrganization) {
        user.currentOrganization = invite.organizationId;
      }

      await Organization.findByIdAndUpdate(invite.organizationId, {
        $push: {
          members: { user: user.id, role: invite.role }
        }
      });

      invite.status = 'accepted';
      await invite.save();
    }
  }

  const { accessToken, refreshToken } = generateTokens(user.id);

  // Save refresh token to user document
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  // Exclude password from the returned object
  const userObject = user.toObject();
  delete userObject.password;

  return { user: userObject, accessToken, refreshToken };
};

export const login = async (loginData: any) => {
  const user = await User.findOne({ email: loginData.email }).select('+password');
  if (!user || !(await user.isPasswordMatch(loginData.password))) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const { accessToken, refreshToken } = generateTokens(user.id);

  // Update refresh token in db
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  // Remove password from output
  const userObject = user.toObject();
  delete userObject.password;

  return { user: userObject, accessToken, refreshToken };
};

export const logout = async (userId: string) => {
  // Clear the refresh token
  await User.findByIdAndUpdate(userId, { refreshToken: '' });
};

export const refreshAuthToken = async (token: string) => {
  try {
    // Verify the token
    const decoded = jwt.verify(token, config.jwt.refreshSecret) as any;
    
    // Find user with this refresh token
    const user = await User.findOne({ _id: decoded.id, refreshToken: token });
    if (!user) {
      throw new ApiError(401, 'Please authenticate');
    }

    // Generate new tokens
    const { accessToken, refreshToken } = generateTokens(user.id);
    
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(401, 'Please authenticate');
  }
};
