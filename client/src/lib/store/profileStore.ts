import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const profileStore = create()(
  persist(
    (set, get) => ({
      // Profile store implementation can be added here
    }),
    {
      name: 'profile-store',
    }
  )
)