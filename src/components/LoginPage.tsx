import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { useAuth, UserRole, ROLE_LABELS } from './AuthContext';
import { Building, Shield, Users, FileText, AlertCircle, Eye, EyeOff } from 'lucide-react';


export function LoginPage() {
  const { login, register, loading } = useAuth();
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: '',
    role: '' as UserRole | ''
  });
  const [registerForm, setRegisterForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    role: '' as UserRole | '',
    organization: '',
    department: ''
  });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState('login');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!loginForm.email || !loginForm.password || !loginForm.role) {
      setError('Please fill in all fields');
      return;
    }

    const success = await login(loginForm.email, loginForm.password, loginForm.role);
    if (!success) {
      setError('Invalid credentials or role mismatch');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!registerForm.email || !registerForm.password || !registerForm.name || !registerForm.role) {
      setError('Please fill in all required fields');
      return;
    }

    if (registerForm.password !== registerForm.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (registerForm.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    const success = await register({
      email: registerForm.email,
      password: registerForm.password,
      name: registerForm.name,
      role: registerForm.role,
      organization: registerForm.organization || undefined,
      department: registerForm.department || undefined
    });

    if (!success) {
      setError('User already exists or registration failed');
    }
  };

  const getHighLevelRoles = () => [
    { value: 'mca_official', label: 'MCA Official', level: 'primary' },
    { value: 'legislation_analyst', label: 'Legislation Analyst', level: 'direct' },
    { value: 'domain_expert', label: 'Domain Expert', level: 'consultant' },
    { value: 'mca21_support', label: 'MCA21 Support', level: 'technical' }
  ];

  const getPublicRoles = () => [
    { value: 'citizen', label: 'Citizen/Organization', level: 'public' },
    { value: 'think_tank', label: 'Think Tank/NGO', level: 'advocacy' }
  ];

  const getBusinessRoles = () => [
    { value: 'business_org', label: 'Business/Organization', level: 'regulated' },
    { value: 'business_corporate', label: 'Corporate Entity', level: 'regulated' },
    { value: 'legal_firm', label: 'Legal Firm', level: 'professional' },
    { value: 'legal_practitioner', label: 'Legal Practitioner', level: 'professional' },
    { value: 'media_analyst', label: 'Media/Legal Analyst', level: 'secondary' }
  ];

  const getDemoCredentials = () => [
    { email: 'admin@mca.gov.in', role: 'mca_official', name: 'MCA Official' },
    { email: 'analyst@mca.gov.in', role: 'legislation_analyst', name: 'Legislation Analyst' },
    { email: 'expert@consultation.com', role: 'domain_expert', name: 'Domain Expert' },
    { email: 'citizen@email.com', role: 'citizen', name: 'Citizen' },
    { email: 'legal@lawfirm.com', role: 'legal_firm', name: 'Legal Firm' }
  ];

  const fillDemoCredentials = (email: string, role: UserRole) => {
    setLoginForm({ email, password: 'password123', role });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        
        {/* Left side - Auth Flow Image and Info */}
        <div className="space-y-6">
          <div className="text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-start space-x-3 mb-4">
              <Building className="h-10 w-10 text-blue-600" />
              <div>
                <h1 className="text-3xl text-primary">MCA e-Consultation Portal</h1>
                <p className="text-muted-foreground">Ministry of Corporate Affairs</p>
              </div>
            </div>
          </div>

          {/* Role Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>User Hierarchy & Access Levels</span>
              </CardTitle>
              <CardDescription>
                Role-based access control system for MCA consultation platform
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <h4 className="font-medium text-blue-700">Government Users</h4>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• MCA Officials (Full Access)</li>
                    <li>• Legislation Analysts</li>
                    <li>• Domain Experts</li>
                    <li>• MCA21 Support Team</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium text-green-700">External Users</h4>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Citizens & Organizations</li>
                    <li>• Business Entities</li>
                    <li>• Legal Practitioners</li>
                    <li>• Think Tanks & Media</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Access Levels Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Shield className="h-5 w-5 text-blue-600" />
                  <span className="font-medium">Government Users</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Full access to all analysis tools, administrative functions, and consultation management.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <FileText className="h-5 w-5 text-green-600" />
                  <span className="font-medium">Public Users</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Submit feedback, view public consultations, and access basic analysis features.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right side - Login/Register Form */}
        <div className="w-full max-w-md mx-auto">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Access Portal</CardTitle>
              <CardDescription>
                Select your role and login to access the MCA consultation platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login">Login</TabsTrigger>
                  <TabsTrigger value="register">Register</TabsTrigger>
                </TabsList>

                <TabsContent value="login" className="space-y-4">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">Email</Label>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="Enter your email"
                        value={loginForm.email}
                        onChange={(e) => setLoginForm(prev => ({ ...prev, email: e.target.value }))}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="login-password">Password</Label>
                      <div className="relative">
                        <Input
                          id="login-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          value={loginForm.password}
                          onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="login-role">User Role</Label>
                      <Select value={loginForm.role} onValueChange={(value: UserRole) => setLoginForm(prev => ({ ...prev, role: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your role" />
                        </SelectTrigger>
                        <SelectContent>
                          <div className="p-2">
                            <p className="text-sm font-medium text-muted-foreground mb-2">Government Users</p>
                            {getHighLevelRoles().map(role => (
                              <SelectItem key={role.value} value={role.value}>
                                <div className="flex items-center space-x-2">
                                  <span>{role.label}</span>
                                  <Badge variant="outline" className="text-xs">Gov</Badge>
                                </div>
                              </SelectItem>
                            ))}
                          </div>
                          <div className="p-2">
                            <p className="text-sm font-medium text-muted-foreground mb-2">Public Users</p>
                            {getPublicRoles().map(role => (
                              <SelectItem key={role.value} value={role.value}>
                                <div className="flex items-center space-x-2">
                                  <span>{role.label}</span>
                                  <Badge variant="secondary" className="text-xs">Public</Badge>
                                </div>
                              </SelectItem>
                            ))}
                          </div>
                          <div className="p-2">
                            <p className="text-sm font-medium text-muted-foreground mb-2">Business Users</p>
                            {getBusinessRoles().map(role => (
                              <SelectItem key={role.value} value={role.value}>
                                <div className="flex items-center space-x-2">
                                  <span>{role.label}</span>
                                  <Badge variant="outline" className="text-xs">Business</Badge>
                                </div>
                              </SelectItem>
                            ))}
                          </div>
                        </SelectContent>
                      </Select>
                    </div>

                    {error && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}

                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? 'Signing in...' : 'Sign In'}
                    </Button>
                  </form>

                  {/* Demo Credentials */}
                  <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm font-medium mb-3">Demo Credentials (Password: password123)</p>
                    <div className="space-y-2">
                      {getDemoCredentials().map((demo, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          className="w-full justify-between text-xs"
                          onClick={() => fillDemoCredentials(demo.email, demo.role as UserRole)}
                        >
                          <span>{demo.name}</span>
                          <span className="text-muted-foreground">{demo.email}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="register" className="space-y-4">
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="register-name">Full Name</Label>
                        <Input
                          id="register-name"
                          placeholder="Enter your name"
                          value={registerForm.name}
                          onChange={(e) => setRegisterForm(prev => ({ ...prev, name: e.target.value }))}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="register-email">Email</Label>
                        <Input
                          id="register-email"
                          type="email"
                          placeholder="Enter your email"
                          value={registerForm.email}
                          onChange={(e) => setRegisterForm(prev => ({ ...prev, email: e.target.value }))}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="register-role">User Role</Label>
                      <Select value={registerForm.role} onValueChange={(value: UserRole) => setRegisterForm(prev => ({ ...prev, role: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your role" />
                        </SelectTrigger>
                        <SelectContent>
                          <div className="p-2">
                            <p className="text-sm font-medium text-muted-foreground mb-2">Public Users</p>
                            {getPublicRoles().map(role => (
                              <SelectItem key={role.value} value={role.value}>
                                {role.label}
                              </SelectItem>
                            ))}
                          </div>
                          <div className="p-2">
                            <p className="text-sm font-medium text-muted-foreground mb-2">Business Users</p>
                            {getBusinessRoles().map(role => (
                              <SelectItem key={role.value} value={role.value}>
                                {role.label}
                              </SelectItem>
                            ))}
                          </div>
                        </SelectContent>
                      </Select>
                    </div>

                    {(registerForm.role === 'business_org' || registerForm.role === 'business_corporate' || 
                      registerForm.role === 'legal_firm' || registerForm.role === 'think_tank') && (
                      <div className="space-y-2">
                        <Label htmlFor="register-organization">Organization</Label>
                        <Input
                          id="register-organization"
                          placeholder="Enter organization name"
                          value={registerForm.organization}
                          onChange={(e) => setRegisterForm(prev => ({ ...prev, organization: e.target.value }))}
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="register-password">Password</Label>
                        <Input
                          id="register-password"
                          type="password"
                          placeholder="Create password"
                          value={registerForm.password}
                          onChange={(e) => setRegisterForm(prev => ({ ...prev, password: e.target.value }))}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="register-confirm">Confirm Password</Label>
                        <Input
                          id="register-confirm"
                          type="password"
                          placeholder="Confirm password"
                          value={registerForm.confirmPassword}
                          onChange={(e) => setRegisterForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                          required
                        />
                      </div>
                    </div>

                    {error && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}

                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? 'Creating Account...' : 'Create Account'}
                    </Button>
                  </form>

                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      Government users must register through official channels. Public registration is available for citizens, businesses, and organizations.
                    </AlertDescription>
                  </Alert>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}