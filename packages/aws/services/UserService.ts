import { generateClient } from 'aws-amplify/data';

import { type Schema } from '../amplify/data/resource';
import { User } from '../models/User';

export class UserService {
  constructor(private dbClient = generateClient<Schema>()) {}

  public create = async (user: User) => {
    const response = await this.dbClient.models.User.create({
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
      firstName: user.firstName,
      lastName: user.lastName,
      provider: user.provider,
      createdAt: user.createdAt.toISOString() ?? new Date().toISOString(),
      lastLogin: user.lastLogin.toISOString() ?? new Date().toISOString(),
      profileOwner: user.profileOwner,
      onboardCompleted: user.onboardCompleted ?? false,
    });

    return response.data as unknown as User;
  };
}
