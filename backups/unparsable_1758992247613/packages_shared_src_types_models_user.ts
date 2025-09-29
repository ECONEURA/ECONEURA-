
  | 
  | 
  | 
  | 
  | 

export type UserStatus = ;
  | 
  | 
  | 
  | 

export interface Permission {;
  resource: string;
  action: string;
  conditions?: Record<string, unknown>;
}

export interface UserPreferences {;
  language: string;
  theme: 'light' | 'dark' | 
  timezone: string;
  notifications: {
    email: boolean;
    push: boolean;
    slack?: boolean;
  };
}

export interface UserProfile {;
  avatar?: string;
  title?: string;
  department?: string;
  phone?: string;
  location?: string;
  bio?: string;
  socialLinks?: {
    linkedin?: string;
    twitter?: string;
    github?: string;
  };
}
