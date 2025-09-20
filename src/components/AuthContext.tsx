import React, { createContext, useContext, useState, useEffect } from 'react';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  organization?: string;
  department?: string;
  verified: boolean;
  permissions: string[];
}

export type UserRole = 
  | 'mca_official'
  | 'legislation_analyst' 
  | 'domain_expert'
  | 'mca21_support'
  | 'citizen'
  | 'business_org'
  | 'business_corporate'
  | 'legal_firm'
  | 'legal_practitioner'
  | 'think_tank'
  | 'media_analyst';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, role: UserRole) => Promise<boolean>;
  register: (userData: RegisterData) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  hasPermission: (permission: string) => boolean;
  loading: boolean;
}

interface RegisterData {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  organization?: string;
  department?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Role-based permissions mapping
const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  mca_official: [
    'view_all_analyses',
    'view_analyses',
    'view_basic_analyses',
    'view_detailed_analytics',
    'export_reports',
    'manage_consultations',
    'admin_access',
    'approve_comments',
    'manage_bills'
  ],
  legislation_analyst: [
    'view_all_analyses',
    'view_analyses',
    'view_basic_analyses',
    'view_detailed_analytics',
    'export_reports',
    'analyze_comments',
    'create_reports'
  ],
  domain_expert: [
    'view_analyses',
    'view_basic_analyses',
    'export_reports',
    'submit_expert_opinions',
    'view_detailed_analytics'
  ],
  mca21_support: [
    'view_analyses',
    'technical_support',
    'system_monitoring',
    'user_support'
  ],
  citizen: [
    'view_basic_analyses',
    'submit_comments',
    'view_public_consultations'
  ],
  business_org: [
    'view_analyses',
    'view_basic_analyses',
    'submit_business_feedback',
    'view_consultations',
    'export_basic_reports'
  ],
  business_corporate: [
    'view_analyses',
    'view_basic_analyses',
    'submit_corporate_feedback',
    'view_consultations',
    'export_reports',
    'priority_support'
  ],
  legal_firm: [
    'view_analyses',
    'view_basic_analyses',
    'submit_legal_opinions',
    'view_consultations',
    'export_reports',
    'legal_research_tools'
  ],
  legal_practitioner: [
    'view_analyses',
    'view_basic_analyses',
    'submit_legal_opinions',
    'view_consultations',
    'legal_research_tools'
  ],
  think_tank: [
    'view_analyses',
    'view_basic_analyses',
    'submit_research_feedback',
    'view_consultations',
    'export_reports',
    'research_tools'
  ],
  media_analyst: [
    'view_basic_analyses',
    'submit_media_comments',
    'view_public_consultations'
  ]
};

// Mock user database
const MOCK_USERS: User[] = [
  {
    id: '1',
    email: 'admin@mca.gov.in',
    name: 'Rajesh Kumar',
    role: 'mca_official',
    department: 'Policy Division',
    verified: true,
    permissions: ROLE_PERMISSIONS.mca_official
  },
  {
    id: '2', 
    email: 'analyst@mca.gov.in',
    name: 'Priya Sharma',
    role: 'legislation_analyst',
    department: 'Legal Analysis',
    verified: true,
    permissions: ROLE_PERMISSIONS.legislation_analyst
  },
  {
    id: '3',
    email: 'expert@consultation.com',
    name: 'Dr. Amit Patel',
    role: 'domain_expert',
    organization: 'Corporate Law Institute',
    verified: true,
    permissions: ROLE_PERMISSIONS.domain_expert
  },
  {
    id: '4',
    email: 'citizen@email.com',
    name: 'Sneha Gupta',
    role: 'citizen',
    verified: true,
    permissions: ROLE_PERMISSIONS.citizen
  },
  {
    id: '5',
    email: 'legal@lawfirm.com',
    name: 'Vikram Singh',
    role: 'legal_firm',
    organization: 'Singh & Associates',
    verified: true,
    permissions: ROLE_PERMISSIONS.legal_firm
  }
];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored user session
    const storedUser = localStorage.getItem('mca_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        localStorage.removeItem('mca_user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string, role: UserRole): Promise<boolean> => {
    setLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Find user in mock database
    const foundUser = MOCK_USERS.find(u => 
      u.email.toLowerCase() === email.toLowerCase() && u.role === role
    );
    
    if (foundUser && password === 'password123') { // Mock password validation
      setUser(foundUser);
      localStorage.setItem('mca_user', JSON.stringify(foundUser));
      setLoading(false);
      return true;
    }
    
    setLoading(false);
    return false;
  };

  const register = async (userData: RegisterData): Promise<boolean> => {
    setLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Check if user already exists
    const existingUser = MOCK_USERS.find(u => 
      u.email.toLowerCase() === userData.email.toLowerCase()
    );
    
    if (existingUser) {
      setLoading(false);
      return false;
    }
    
    // Create new user
    const newUser: User = {
      id: Date.now().toString(),
      email: userData.email,
      name: userData.name,
      role: userData.role,
      organization: userData.organization,
      department: userData.department,
      verified: ['citizen', 'media_analyst'].includes(userData.role), // Auto-verify some roles
      permissions: ROLE_PERMISSIONS[userData.role]
    };
    
    // Add to mock database (in real app, this would be API call)
    MOCK_USERS.push(newUser);
    
    setUser(newUser);
    localStorage.setItem('mca_user', JSON.stringify(newUser));
    setLoading(false);
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('mca_user');
  };

  const hasPermission = (permission: string): boolean => {
    return user?.permissions.includes(permission) || false;
  };

  const value = {
    user,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    hasPermission,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  mca_official: 'MCA Official (Primary End User)',
  legislation_analyst: 'Legislation Review Committee/Analyst', 
  domain_expert: 'Domain Expert/Consultant',
  mca21_support: 'MCA21 Portal Team (Tech/Support)',
  citizen: 'Citizen/Organization (Public Feedback)',
  business_org: 'Business/Organization (Regulated Entity)',
  business_corporate: 'Business/Corporate (Regulated Entity)',
  legal_firm: 'Legal Firm (LawFactory)',
  legal_practitioner: 'Legal Practitioner (Compliance Advisor)',
  think_tank: 'Think Tank/NGO/Advocacy',
  media_analyst: 'Media/Legal Analyst (Secondary Commenter)'
};