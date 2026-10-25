import { ziteAuth } from 'zitejs/auth/server';
import { zite } from 'zitejs/db';

export default ziteAuth({
  hooks: {
    async verifySession({ user }) {
      const profile = await zite.profiles.findOne({ filters: { account: user.id } });
      if (profile?.status === 'Banned') return { active: false };
      return { active: true };
    },
  },
});
