import { ReactNode } from 'react';
import { Alert, AlertDescription } from './ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useAuth, UserRole } from './AuthContext';
import { Shield, AlertTriangle, Lock, User } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredPermissions?: string[];
  requiredRoles?: UserRole[];
  fallbackMessage?: string;
  allowedComponent?: ReactNode;
}

export function ProtectedRoute({ 
  children, 
  requiredPermissions = [], 
  requiredRoles = [],
  fallbackMessage,
  allowedComponent 
}: ProtectedRouteProps) {
  const { user, hasPermission, isAuthenticated } = useAuth();

  // Check if user is authenticated
  if (!isAuthenticated || !user) {
    return (
      <Card className="max-w-md mx-auto mt-8">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Lock className="h-5 w-5 text-orange-600" />
            <span>Authentication Required</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Please log in to access this feature.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Check role requirements
  if (requiredRoles.length > 0 && !requiredRoles.includes(user.role)) {
    return (
      <Card className="max-w-md mx-auto mt-8">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-red-600" />
            <span>Access Denied</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {fallbackMessage || 'You do not have the required role to access this feature.'}
            </AlertDescription>
          </Alert>
          
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Your current role:</p>
            <Badge variant="outline">{user.role.replace('_', ' ').toUpperCase()}</Badge>
          </div>
          
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Required roles:</p>
            <div className="flex flex-wrap gap-2">
              {requiredRoles.map(role => (
                <Badge key={role} variant="secondary">
                  {role.replace('_', ' ').toUpperCase()}
                </Badge>
              ))}
            </div>
          </div>

          {allowedComponent && (
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-3">Available features for your role:</p>
              {allowedComponent}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Check permission requirements (user needs ANY of the required permissions, not ALL)
  if (requiredPermissions.length > 0) {
    const hasAnyPermission = requiredPermissions.some(permission => hasPermission(permission));
    
    if (!hasAnyPermission) {
      return (
        <Card className="max-w-md mx-auto mt-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-orange-600" />
              <span>Insufficient Permissions</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {fallbackMessage || 'You do not have the required permissions to access this feature.'}
              </AlertDescription>
            </Alert>
            
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Required permissions (you need at least one):</p>
              <div className="flex flex-wrap gap-2">
                {requiredPermissions.map(permission => (
                  <Badge key={permission} variant="destructive">
                    {permission.replace('_', ' ').toUpperCase()}
                  </Badge>
                ))}
              </div>
            </div>

            {allowedComponent && (
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-3">Available features for your role:</p>
                {allowedComponent}
              </div>
            )}
          </CardContent>
        </Card>
      );
    }
  }

  // User has access, render the protected content
  return <>{children}</>;
}

// Helper component for role-based feature visibility
export function RoleBasedFeature({ 
  allowedRoles, 
  requiredPermissions = [],
  children, 
  fallback = null 
}: {
  allowedRoles: UserRole[];
  requiredPermissions?: string[];
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { user, hasPermission } = useAuth();

  if (!user) return fallback;

  const hasRole = allowedRoles.includes(user.role);
  const hasAnyPermission = requiredPermissions.length === 0 || requiredPermissions.some(permission => hasPermission(permission));

  if (hasRole && hasAnyPermission) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}

// Helper component for permission-based feature visibility
export function PermissionBasedFeature({ 
  requiredPermissions, 
  children, 
  fallback = null 
}: {
  requiredPermissions: string[];
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { hasPermission } = useAuth();

  const hasAnyPermission = requiredPermissions.length === 0 || requiredPermissions.some(permission => hasPermission(permission));

  if (hasAnyPermission) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}