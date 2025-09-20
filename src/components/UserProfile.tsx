import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Separator } from './ui/separator';
import { 
  User, Building, Shield, LogOut, Settings, 
  CheckCircle, AlertCircle, Clock, Mail, Phone 
} from 'lucide-react';
import { useAuth, ROLE_LABELS } from './AuthContext';

export function UserProfile() {
  const { user, logout, hasPermission } = useAuth();
  const [showDetails, setShowDetails] = useState(false);

  if (!user) return null;

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getRoleColor = (role: string) => {
    const colorMap: Record<string, string> = {
      mca_official: 'bg-blue-100 text-blue-800',
      legislation_analyst: 'bg-purple-100 text-purple-800',
      domain_expert: 'bg-green-100 text-green-800',
      mca21_support: 'bg-orange-100 text-orange-800',
      citizen: 'bg-gray-100 text-gray-800',
      business_org: 'bg-yellow-100 text-yellow-800',
      business_corporate: 'bg-yellow-100 text-yellow-800',
      legal_firm: 'bg-indigo-100 text-indigo-800',
      legal_practitioner: 'bg-indigo-100 text-indigo-800',
      think_tank: 'bg-pink-100 text-pink-800',
      media_analyst: 'bg-cyan-100 text-cyan-800'
    };
    return colorMap[role] || 'bg-gray-100 text-gray-800';
  };

  const getAccessLevel = (role: string) => {
    if (['mca_official', 'legislation_analyst'].includes(role)) return 'Full Access';
    if (['domain_expert', 'mca21_support'].includes(role)) return 'Extended Access';
    if (['business_corporate', 'legal_firm'].includes(role)) return 'Business Access';
    return 'Basic Access';
  };

  const getVerificationStatus = () => {
    if (user.verified) {
      return (
        <div className="flex items-center space-x-2 text-green-600">
          <CheckCircle className="h-4 w-4" />
          <span className="text-sm">Verified Account</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center space-x-2 text-orange-600">
          <Clock className="h-4 w-4" />
          <span className="text-sm">Pending Verification</span>
        </div>
      );
    }
  };

  const keyPermissions = [
    { key: 'view_all_analyses', label: 'View All Analyses' },
    { key: 'export_reports', label: 'Export Reports' },
    { key: 'manage_consultations', label: 'Manage Consultations' },
    { key: 'admin_access', label: 'Admin Access' },
    { key: 'approve_comments', label: 'Approve Comments' },
    { key: 'submit_comments', label: 'Submit Comments' },
    { key: 'legal_research_tools', label: 'Legal Research Tools' }
  ];

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-lg">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-xl">{user.name}</CardTitle>
              <CardDescription className="flex items-center space-x-2">
                <Mail className="h-4 w-4" />
                <span>{user.email}</span>
              </CardDescription>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowDetails(!showDetails)}>
            <Settings className="h-4 w-4 mr-2" />
            {showDetails ? 'Hide Details' : 'Show Details'}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Role and Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="font-medium flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span>Role</span>
            </h4>
            <Badge className={getRoleColor(user.role)}>
              {ROLE_LABELS[user.role]}
            </Badge>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium flex items-center space-x-2">
              <Shield className="h-4 w-4" />
              <span>Access Level</span>
            </h4>
            <Badge variant="outline">
              {getAccessLevel(user.role)}
            </Badge>
          </div>
        </div>

        {/* Organization/Department */}
        {(user.organization || user.department) && (
          <div className="space-y-2">
            <h4 className="font-medium flex items-center space-x-2">
              <Building className="h-4 w-4" />
              <span>Organization</span>
            </h4>
            <div className="text-sm text-muted-foreground">
              {user.organization && <p>Organization: {user.organization}</p>}
              {user.department && <p>Department: {user.department}</p>}
            </div>
          </div>
        )}

        {/* Verification Status */}
        <div className="space-y-2">
          <h4 className="font-medium">Account Status</h4>
          {getVerificationStatus()}
          {!user.verified && (
            <p className="text-sm text-muted-foreground">
              Your account is pending verification. Some features may be limited until verification is complete.
            </p>
          )}
        </div>

        {showDetails && (
          <>
            <Separator />
            
            {/* Permissions */}
            <div className="space-y-3">
              <h4 className="font-medium">Permissions & Access</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {keyPermissions.map(permission => (
                  <div 
                    key={permission.key}
                    className={`flex items-center space-x-2 p-2 rounded text-sm ${
                      hasPermission(permission.key) 
                        ? 'bg-green-50 text-green-700' 
                        : 'bg-gray-50 text-gray-500'
                    }`}
                  >
                    {hasPermission(permission.key) ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <AlertCircle className="h-4 w-4" />
                    )}
                    <span>{permission.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Session Info */}
            <div className="space-y-2">
              <h4 className="font-medium">Session Information</h4>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>User ID: {user.id}</p>
                <p>Login Time: {new Date().toLocaleString()}</p>
                <p>Role Level: {ROLE_LABELS[user.role]}</p>
              </div>
            </div>
          </>
        )}

        {/* Actions */}
        <Separator />
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Logged in as {ROLE_LABELS[user.role]}
          </div>
          <Button variant="outline" onClick={logout} className="flex items-center space-x-2">
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}