import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Button } from './components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Badge } from './components/ui/badge';
import { Avatar, AvatarFallback } from './components/ui/avatar';
import { MessageCircle, BarChart3, FileText, Cloud, TrendingUp, Users, Building, User, LogOut } from 'lucide-react';
import { SentimentDashboard } from './components/SentimentDashboard';
import { CommentSummarizer } from './components/CommentSummarizer';
import { WordCloudGenerator } from './components/WordCloudGenerator';
import { CombinedInsights } from './components/CombinedInsights';
import { LiveStreamAnalyzer } from './components/LiveStreamAnalyzer';
import { AuthProvider, useAuth } from './components/AuthContext';
import { LoginPage } from './components/LoginPage';
import { UserProfile } from './components/UserProfile';
import { ProtectedRoute, RoleBasedFeature, PermissionBasedFeature } from './components/ProtectedRoute';

function AppContent() {
  const { user, logout, isAuthenticated, hasPermission } = useAuth();
  const [currentView, setCurrentView] = useState('home');
  const [showProfile, setShowProfile] = useState(false);

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const navigationItems = [
    { 
      id: 'home', 
      label: 'MCA e-Consultation', 
      icon: Building,
      permissions: [] // Everyone can access home
    },
    { 
      id: 'sentiment', 
      label: 'Sentiment Analysis', 
      icon: BarChart3,
      permissions: ['view_analyses', 'view_all_analyses']
    },
    { 
      id: 'summarizer', 
      label: 'Comment Summarizer', 
      icon: FileText,
      permissions: ['view_analyses', 'view_all_analyses']
    },
    { 
      id: 'wordcloud', 
      label: 'Word Cloud', 
      icon: Cloud,
      permissions: ['view_basic_analyses', 'view_analyses', 'view_all_analyses']
    },
    { 
      id: 'combined', 
      label: 'Combined Insights', 
      icon: TrendingUp,
      permissions: ['view_detailed_analytics', 'view_all_analyses']
    },
    { 
      id: 'livestream', 
      label: 'Live Stream', 
      icon: Users,
      permissions: ['view_detailed_analytics', 'view_all_analyses']
    },
  ];

  // Filter navigation items based on permissions
  const availableNavItems = navigationItems.filter(item => 
    item.permissions.length === 0 || item.permissions.some(permission => hasPermission(permission))
  );

  const renderView = () => {
    if (showProfile) {
      return <UserProfile />;
    }

    switch (currentView) {
      case 'sentiment':
        return (
          <ProtectedRoute 
            requiredPermissions={['view_analyses', 'view_all_analyses']}
            fallbackMessage="Sentiment analysis requires view access permissions."
          >
            <SentimentDashboard />
          </ProtectedRoute>
        );
      case 'summarizer':
        return (
          <ProtectedRoute 
            requiredPermissions={['view_analyses', 'view_all_analyses']}
            fallbackMessage="Comment summarizer requires view access permissions."
          >
            <CommentSummarizer />
          </ProtectedRoute>
        );
      case 'wordcloud':
        return <WordCloudGenerator />;
      case 'combined':
        // Allow Combined Insights for all users per requirement
        return <CombinedInsights />;
      case 'livestream':
        return (
          <ProtectedRoute 
            requiredPermissions={['view_detailed_analytics', 'view_all_analyses']}
            fallbackMessage="Live stream analyzer requires detailed analytics permissions."
          >
            <LiveStreamAnalyzer />
          </ProtectedRoute>
        );
      default:
        return <HomePage onViewAnalysis={() => setCurrentView('combined')} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Header */}
      <header className="border-b bg-card shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Building className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-xl font-medium">MCA Insight Hub</h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Badge variant="secondary">Keystone</Badge>
              {/* User Menu */}
              <div className="flex items-center space-x-3">
                <div className="text-right hidden md:block">
                  <p className="text-sm font-medium">{user?.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {user?.role.replace('_', ' ').toUpperCase()}
                  </p>
                </div>
                
                <Avatar 
                  className="h-8 w-8 cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                  onClick={() => setShowProfile(!showProfile)}
                >
                  <AvatarFallback className="text-sm">
                    {user ? getInitials(user.name) : 'U'}
                  </AvatarFallback>
                </Avatar>
                
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={logout}
                  className="flex items-center space-x-1"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden md:inline">Sign Out</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="border-b bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1 overflow-x-auto py-2">
            {availableNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.id}
                  variant={(currentView === item.id && !showProfile) ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => {
                    setCurrentView(item.id);
                    setShowProfile(false);
                  }}
                  className="flex items-center space-x-2 whitespace-nowrap"
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Button>
              );
            })}
            
            <Button
              variant={showProfile ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setShowProfile(!showProfile)}
              className="flex items-center space-x-2 whitespace-nowrap ml-auto"
            >
              <User className="h-4 w-4" />
              <span>Profile</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderView()}
      </main>
    </div>
  );
}

function HomePage({ onViewAnalysis }: { onViewAnalysis: () => void }) {
  const { user, hasPermission } = useAuth();
  const recentStats = useMemo(() => {
    const make = () => {
      const comments = Math.floor(300 + Math.random() * 3000);
      const positive = Math.floor(40 + Math.random() * 50); // 40-90%
      const negativeBase = Math.floor(5 + Math.random() * 40); // 5-45%
      const negative = Math.min(negativeBase, 100 - positive - 5); // leave room for neutral
      return { comments, positive, negative };
    };
    return Array.from({ length: 6 }, make);
  }, []);
  
  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl text-primary">
          Welcome, {user?.name}
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Analyze public comments on drafts and bills from the Ministry of Corporate Affairs. 
          Access features based on your role as {user?.role.replace('_', ' ')}.
        </p>
        
        {/* Role-specific welcome message */}
        <div className="max-w-2xl mx-auto">
          <RoleBasedFeature allowedRoles={['mca_official', 'legislation_analyst']}>
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <p className="text-sm text-blue-800">
                  <strong>Government Access:</strong> You have full access to all analysis tools, 
                  administrative functions, and consultation management features.
                </p>
              </CardContent>
            </Card>
          </RoleBasedFeature>
          
          <RoleBasedFeature allowedRoles={['domain_expert', 'mca21_support']}>
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4">
                <p className="text-sm text-green-800">
                  <strong>Expert Access:</strong> You have extended access to analysis tools 
                  and can contribute expert opinions to consultations.
                </p>
              </CardContent>
            </Card>
          </RoleBasedFeature>
          
          <RoleBasedFeature allowedRoles={['business_org', 'business_corporate', 'legal_firm', 'legal_practitioner']}>
            <Card className="bg-yellow-50 border-yellow-200">
              <CardContent className="p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Business Access:</strong> You can submit business feedback, 
                  view consultations, and access relevant analysis features.
                </p>
              </CardContent>
            </Card>
          </RoleBasedFeature>
          
          <RoleBasedFeature allowedRoles={['citizen', 'think_tank', 'media_analyst']}>
            <Card className="bg-gray-50 border-gray-200">
              <CardContent className="p-4">
                <p className="text-sm text-gray-800">
                  <strong>Public Access:</strong> You can submit comments, view public consultations, 
                  and access basic analysis features.
                </p>
              </CardContent>
            </Card>
          </RoleBasedFeature>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Sentiment Analysis */}
        <PermissionBasedFeature 
          requiredPermissions={['view_analyses', 'view_all_analyses']}
          fallback={
            <Card className="opacity-50">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <BarChart3 className="h-6 w-6 text-gray-400" />
                  </div>
                  <CardTitle className="text-gray-500">Sentiment Analysis</CardTitle>
                </div>
                <CardDescription>
                  <Badge variant="outline" className="text-xs">Access Restricted</Badge>
                </CardDescription>
              </CardHeader>
            </Card>
          }
        >
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Sentiment Analysis</CardTitle>
              </div>
              <CardDescription>
                Analyze the emotional tone of public comments on proposed bills and drafts.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Real-time sentiment scoring</li>
                <li>• Positive, neutral, negative classification</li>
                <li>• Interactive visualization charts</li>
                <li>• Filter comments by sentiment</li>
              </ul>
            </CardContent>
          </Card>
        </PermissionBasedFeature>

        {/* Comment Summarizer */}
        <PermissionBasedFeature 
          requiredPermissions={['view_analyses', 'view_all_analyses']}
          fallback={
            <Card className="opacity-50">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <FileText className="h-6 w-6 text-gray-400" />
                  </div>
                  <CardTitle className="text-gray-500">Comment Summarizer</CardTitle>
                </div>
                <CardDescription>
                  <Badge variant="outline" className="text-xs">Access Restricted</Badge>
                </CardDescription>
              </CardHeader>
            </Card>
          }
        >
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Comment Summarizer</CardTitle>
              </div>
              <CardDescription>
                Generate concise summaries of public feedback and identify key themes.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Automated text summarization</li>
                <li>• Customizable summary length</li>
                <li>• Key phrase highlighting</li>
                <li>• Common themes extraction</li>
              </ul>
            </CardContent>
          </Card>
        </PermissionBasedFeature>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Cloud className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Word Cloud Generator</CardTitle>
            </div>
            <CardDescription>
              Visualize the most frequently mentioned terms in public comments.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Interactive word clouds</li>
              <li>• Frequency-based sizing</li>
              <li>• Stopword filtering</li>
              <li>• Export capabilities</li>
            </ul>
          </CardContent>
        </Card>

        {/* Combined Insights */}
        <PermissionBasedFeature 
          requiredPermissions={['view_detailed_analytics', 'view_all_analyses']}
          fallback={
            <Card className="opacity-50">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-gray-400" />
                  </div>
                  <CardTitle className="text-gray-500">Combined Insights</CardTitle>
                </div>
                <CardDescription>
                  <Badge variant="outline" className="text-xs">Premium Feature</Badge>
                </CardDescription>
              </CardHeader>
            </Card>
          }
        >
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Combined Insights</CardTitle>
              </div>
              <CardDescription>
                Comprehensive analysis combining all features in one dashboard.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Multi-tab interface</li>
                <li>• Unified data processing</li>
                <li>• Export combined reports</li>
                <li>• Real-time updates</li>
              </ul>
            </CardContent>
          </Card>
        </PermissionBasedFeature>

        {/* Live Stream Analyzer */}
        <PermissionBasedFeature 
          requiredPermissions={['view_detailed_analytics', 'view_all_analyses']}
          fallback={
            <Card className="opacity-50">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <Users className="h-6 w-6 text-gray-400" />
                  </div>
                  <CardTitle className="text-gray-500">Live Stream Analyzer</CardTitle>
                </div>
                <CardDescription>
                  <Badge variant="outline" className="text-xs">Premium Feature</Badge>
                </CardDescription>
              </CardHeader>
            </Card>
          }
        >
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Live Stream Analyzer</CardTitle>
              </div>
              <CardDescription>
                Monitor real-time comment streams with dynamic analysis updates.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Simulated live comment feed</li>
                <li>• Dynamic sentiment tracking</li>
                <li>• Real-time visualizations</li>
                <li>• Stream controls</li>
              </ul>
            </CardContent>
          </Card>
        </PermissionBasedFeature>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <MessageCircle className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Public Consultation</CardTitle>
            </div>
            <CardDescription>
              Access to draft bills and documents for public feedback collection.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Draft bill repository</li>
              <li>• Comment submission portal</li>
              <li>• Stakeholder engagement</li>
              <li>• Feedback categorization</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Recent Bills Section */}
      <div className="space-y-4">
        <h2 className="text-2xl text-primary">Recent Draft Bills & Consultations</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Companies (Amendment) Bill 2024</CardTitle>
              <CardDescription>Comments due: March 15, 2024</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <p className="text-sm">Total Comments: {recentStats[0].comments}</p>
                  <div className="flex space-x-2">
                    <Badge variant="outline" className="text-green-600">Positive: {recentStats[0].positive}%</Badge>
                    <Badge variant="outline" className="text-red-600">Negative: {recentStats[0].negative}%</Badge>
                  </div>
                </div>
                {/* Make View Analysis button black and available to all users */}
                <Button 
                  size="sm" 
                  className="bg-black text-white hover:bg-black/90"
                  onClick={onViewAnalysis}
                >
                  View Analysis
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Corporate Social Responsibility Rules</CardTitle>
              <CardDescription>Comments due: March 30, 2024</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <p className="text-sm">Total Comments: {recentStats[1].comments}</p>
                  <div className="flex space-x-2">
                    <Badge variant="outline" className="text-green-600">Positive: {recentStats[1].positive}%</Badge>
                    <Badge variant="outline" className="text-red-600">Negative: {recentStats[1].negative}%</Badge>
                  </div>
                </div>
                {/* Make View Analysis button black and available to all users */}
                <Button 
                  size="sm" 
                  className="bg-black text-white hover:bg-black/90"
                  onClick={onViewAnalysis}
                >
                  View Analysis
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Insolvency and Bankruptcy Code (Amendment) Bill, 2025</CardTitle>
              <CardDescription>Introduced in Lok Sabha (2025)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <p className="text-sm">Total Comments: {recentStats[2].comments}</p>
                  <div className="flex space-x-2">
                    <Badge variant="outline" className="text-green-600">Positive: {recentStats[2].positive}%</Badge>
                    <Badge variant="outline" className="text-red-600">Negative: {recentStats[2].negative}%</Badge>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  className="bg-black text-white hover:bg-black/90"
                  onClick={onViewAnalysis}
                >
                  View Analysis
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Companies (Accounts) Second Amendment Rules, 2025</CardTitle>
              <CardDescription>Public consultation update (2025)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <p className="text-sm">Total Comments: {recentStats[3].comments}</p>
                  <div className="flex space-x-2">
                    <Badge variant="outline" className="text-green-600">Positive: {recentStats[3].positive}%</Badge>
                    <Badge variant="outline" className="text-red-600">Negative: {recentStats[3].negative}%</Badge>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  className="bg-black text-white hover:bg-black/90"
                  onClick={onViewAnalysis}
                >
                  View Analysis
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Companies (Restriction on Number of Layers) Amendment Rules, 2025</CardTitle>
              <CardDescription>Draft amendment update (2025)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <p className="text-sm">Total Comments: {recentStats[4].comments}</p>
                  <div className="flex space-x-2">
                    <Badge variant="outline" className="text-green-600">Positive: {recentStats[4].positive}%</Badge>
                    <Badge variant="outline" className="text-red-600">Negative: {recentStats[4].negative}%</Badge>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  className="bg-black text-white hover:bg-black/90"
                  onClick={onViewAnalysis}
                >
                  View Analysis
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">IBBI (Insolvency Resolution Process for Corporate Persons) (Fourth Amendment) Regulations, 2025</CardTitle>
              <CardDescription>Regulations update (May 26, 2025)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <p className="text-sm">Total Comments: {recentStats[5].comments}</p>
                  <div className="flex space-x-2">
                    <Badge variant="outline" className="text-green-600">Positive: {recentStats[5].positive}%</Badge>
                    <Badge variant="outline" className="text-red-600">Negative: {recentStats[5].negative}%</Badge>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  className="bg-black text-white hover:bg-black/90"
                  onClick={onViewAnalysis}
                >
                  View Analysis
                </Button>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}