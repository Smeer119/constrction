// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

// Debug log environment variables
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
console.log('Supabase Anon Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

// Initialize Supabase client
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    }
  }
)

// Types
export type UserRole = 'admin' | 'engineer' | 'contractor' | 'worker'
export type UserType = 'individual' | 'industry'

export interface UserProfile {
  id: string
  email: string
  name: string
  user_type: UserType
  role?: UserRole
  special_key?: string
  created_at: string
}

// Helper function to get user profile with debug logs
export const getUserProfile = async (userId: string) => {
  console.log('Fetching user profile for:', userId)
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error fetching user profile:', error)
      throw error
    }

    console.log('User profile fetched successfully:', data)
    return data as UserProfile
  } catch (error) {
    console.error('Failed to fetch user profile:', error)
    return null
  }
}