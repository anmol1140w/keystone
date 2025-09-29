import { useState, useEffect, useRef, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Slider } from './ui/slider';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { 
  Play, Pause, Square, Settings, TrendingUp, Users, MessageCircle, 
  ThumbsUp, ThumbsDown, Minus, Activity, BarChart3 
} from 'lucide-react';

// Backend URL for API calls - using local fallback since remote API is failing
// const BACKEND_URL = "https://hf-mediator.onrender.com";
const USE_LOCAL_FALLBACK = true; // Set to true to use local fallback instead of remote API

// Cache to store sentiment analysis results and prevent duplicate API calls
const sentimentCache = new Map();

// Global AbortController to cancel pending requests
let activeRequestController: AbortController | null = null;

interface Comment {
  id: number;
  text: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  score: number;
  timestamp: Date;
  user: string;
}

interface StreamStats {
  totalComments: number;
  positive: number;
  negative: number;
  neutral: number;
  avgSentiment: number;
}

// API call to analyze sentiment
async function analyzeSentiment(text: string) {
  // Create a new AbortController for this request
  if (activeRequestController) {
    activeRequestController.abort(); // Cancel any previous request
  }
  activeRequestController = new AbortController();
  
  // Use local fallback mechanism to avoid API errors
  if (USE_LOCAL_FALLBACK) {
    return getLocalSentimentAnalysis(text);
  }
  
  try {
    const BACKEND_URL = "https://hf-mediator.onrender.com"; // Only used if not using fallback
    const response = await fetch(`${BACKEND_URL}/sentiment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ comments: [text] }),
      signal: activeRequestController.signal
    });

    const result = await response.json();
    const rows: any[] = result?.data?.data || [];

    if (rows.length === 0) {
      return { sentiment: "neutral", score: 0, confidence: 0 };
    }

    const row = rows[0];
    const sentiment = (row[1] ?? "neutral").toLowerCase();
    const confidence = parseFloat((row[2]?.replace("%", "") ?? 0)) / 100;
    
    // Calculate score based on sentiment
    let score = 0;
    if (sentiment === 'positive') {
      score = 0.5 + (confidence * 0.5); // 0.5 to 1.0
    } else if (sentiment === 'negative') {
      score = -0.5 - (confidence * 0.5); // -0.5 to -1.0
    } else {
      score = (Math.random() - 0.5) * 0.4; // -0.2 to 0.2 for neutral
    }

    return {
      sentiment: sentiment as 'positive' | 'negative' | 'neutral',
      score,
      confidence
    };
  } catch (err) {
    console.error("Error fetching sentiment:", err);
    return getLocalSentimentAnalysis(text);
  }
}

// Local sentiment analysis fallback
function getLocalSentimentAnalysis(text: string) {
  // Simple keyword-based sentiment analysis
  const positiveWords = ['good', 'great', 'excellent', 'wonderful', 'amazing', 'support', 'benefit', 'helpful', 'improve'];
  const negativeWords = ['bad', 'poor', 'terrible', 'awful', 'oppose', 'burden', 'restrictive', 'unnecessary', 'concern'];
  
  text = text.toLowerCase();
  let positiveCount = 0;
  let negativeCount = 0;
  
  // Count positive and negative words
  positiveWords.forEach(word => {
    if (text.includes(word)) positiveCount++;
  });
  
  negativeWords.forEach(word => {
    if (text.includes(word)) negativeCount++;
  });
  
  // Determine sentiment based on word counts
  let sentiment: 'positive' | 'negative' | 'neutral';
  let score = 0;
  let confidence = 0;
  
  if (positiveCount > negativeCount) {
    sentiment = 'positive';
    confidence = Math.min(0.5 + (positiveCount - negativeCount) * 0.1, 0.9);
    score = 0.5 + (confidence * 0.5);
  } else if (negativeCount > positiveCount) {
    sentiment = 'negative';
    confidence = Math.min(0.5 + (negativeCount - positiveCount) * 0.1, 0.9);
    score = -(0.5 + (confidence * 0.5));
  } else {
    // If no keywords or equal counts, use random sentiment with lower confidence
    sentiment = 'neutral';
    confidence = 0.3 + Math.random() * 0.2;
    score = (Math.random() - 0.5) * 0.4;
  }
  
  return { 
    sentiment, 
    score, 
    confidence 
  };
}
// (no code needed – the stray closing brace was simply removed)

// Comment generator with API integration
const generateRandomComment = async (id: number): Promise<Comment> => {
  const commentPool = [
    "This bill is excellent and will benefit businesses greatly!",
    "I fully support this initiative. Great work by MCA!",
    "This amendment addresses our long-standing concerns perfectly.",
    "Wonderful step towards better corporate governance.",
    "The digital filing provisions are very helpful for startups.",
    "This will improve transparency significantly. Well done!",
    "Great balance between regulation and business freedom.",
    "This bill shows excellent understanding of industry needs.",
    "This amendment will create unnecessary burden on companies.",
    "I strongly oppose these changes. Too restrictive!",
    "The compliance costs will be unbearable for small businesses.",
    "This bill doesn't address the real issues we're facing.",
    "The implementation timeline is too aggressive.",
    "These provisions are poorly drafted and unclear.",
    "This will harm the startup ecosystem significantly.",
    "The penalty structure is disproportionate and unfair.",
    "The proposed changes seem reasonable but need more clarity.",
    "I have mixed feelings about this amendment.",
    "More consultation with stakeholders would be beneficial.",
    "The implementation guidelines need to be more detailed.",
    "Some provisions are good, others need reconsideration.",
    "The impact on different sectors needs careful assessment.",
    "More time is needed to evaluate the full implications.",
    "The bill has both positive and concerning aspects."
  ];

  const userNames = ['Rajesh Kumar', 'Priya Sharma', 'Amit Patel', 'Sneha Gupta', 'Vikram Singh', 'Ananya Das', 'Rohit Verma', 'Kavya Nair'];
  const text = commentPool[Math.floor(Math.random() * commentPool.length)];
  
  // Get sentiment from API
  const sentimentResult = await analyzeSentiment(text);
  
  return {
    id,
    text,
    sentiment: sentimentResult.sentiment as 'positive' | 'negative' | 'neutral',
    score: sentimentResult.score,
    timestamp: new Date(),
    user: userNames[Math.floor(Math.random() * userNames.length)]
  };
};

export function LiveStreamAnalyzer() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [streamSpeed, setStreamSpeed] = useState([2]);
  const [autoScroll, setAutoScroll] = useState(true);
  const [manualInput, setManualInput] = useState("");
  const [stats, setStats] = useState<StreamStats>({
    totalComments: 0,
    positive: 0,
    negative: 0,
    neutral: 0,
    avgSentiment: 0
  });
  const [sentimentHistory, setSentimentHistory] = useState<Array<{
    time: string;
    sentiment: number;
    positive: number;
    negative: number;
    neutral: number;
  }>>([]);
  
  const commentsRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const commentIdRef = useRef(0);

  const updateStats = (newComments: Comment[]) => {
    const positive = newComments.filter(c => c.sentiment === 'positive').length;
    const negative = newComments.filter(c => c.sentiment === 'negative').length;
    const neutral = newComments.filter(c => c.sentiment === 'neutral').length;
    const total = newComments.length;
    const avgSentiment = total > 0 ? newComments.reduce((sum, c) => sum + c.score, 0) / total : 0;

    setStats({
      totalComments: total,
      positive,
      negative,
      neutral,
      avgSentiment
    });

    // Update sentiment history for chart
    const now = new Date();
    const timeStr = now.toLocaleTimeString();
    
    setSentimentHistory(prev => {
      const newEntry = {
        time: timeStr,
        sentiment: avgSentiment,
        positive,
        negative,
        neutral
      };
      
      const updated = [...prev, newEntry];
      // Keep only last 20 data points
      return updated.slice(-20);
    });
  };

  const addComment = async (customText?: string) => {
    let newComment;
    
    if (customText) {
      // Use custom text if provided
      const sentimentResult = await analyzeSentiment(customText);
      newComment = {
        id: commentIdRef.current++,
        text: customText,
        sentiment: sentimentResult.sentiment,
        score: sentimentResult.score,
        timestamp: new Date(),
        user: 'You'
      };
    } else {
      // Otherwise generate random comment
      newComment = await generateRandomComment(commentIdRef.current++);
    }
    
    setComments(prev => {
      const updated = [newComment, ...prev].slice(0, 100); // Keep only last 100 comments
      updateStats(updated);
      return updated;
    });

    if (autoScroll && commentsRef.current) {
      commentsRef.current.scrollTop = 0;
    }
  };

  const startStream = () => {
    setIsStreaming(true);
  };

  const pauseStream = () => {
    setIsStreaming(false);
    
    // Clear the interval but don't reset other state
    if (intervalRef.current) {
      clearTimeout(intervalRef.current);
      intervalRef.current = null;
    }
    
    // Cancel any pending API requests
    if (activeRequestController) {
      activeRequestController.abort();
      activeRequestController = null;
    }
  };

  const stopStream = () => {
    setIsStreaming(false);
    
    // Cancel any pending API requests
    if (activeRequestController) {
      activeRequestController.abort();
      activeRequestController = null;
    }
    
    // Clear any pending timeouts
    if (intervalRef.current) {
      clearTimeout(intervalRef.current);
      intervalRef.current = null;
    }
    
    // Reset all state
    setComments([]);
    setStats({
      totalComments: 0,
      positive: 0,
      negative: 0,
      neutral: 0,
      avgSentiment: 0
    });
    setSentimentHistory([]);
    commentIdRef.current = 0;
  };

  const loadSampleData = async () => {
    // If there's manual input, use it for the first comment
    if (manualInput.trim()) {
      const sentimentResult = await analyzeSentiment(manualInput.trim());
      const manualComment = {
        id: commentIdRef.current++,
        text: manualInput.trim(),
        sentiment: sentimentResult.sentiment,
        score: sentimentResult.score,
        timestamp: new Date(),
        user: 'You'
      };
      
      // Generate the rest of the comments
      const initialCommentsPromises = Array.from({ length: 9 }, (_, i) => 
        generateRandomComment(commentIdRef.current++)
      );
      const randomComments = await Promise.all(initialCommentsPromises);
      
      const initialComments = [manualComment, ...randomComments];
      setComments(initialComments);
      updateStats(initialComments as Comment[]);
      setManualInput(""); // Clear after use
    } else {
      // Generate all random comments if no manual input
      const initialCommentsPromises = Array.from({ length: 10 }, (_, i) => 
        generateRandomComment(commentIdRef.current++)
      );
      const initialComments = await Promise.all(initialCommentsPromises);
      setComments(initialComments);
      updateStats(initialComments);
    }
  };

  useEffect(() => {
    if (isStreaming) {
      const simulateStream = async () => {
        // Only generate random comments in the automatic stream
        await addComment();
        
        // Only schedule next comment if still streaming
        if (isStreaming) {
          intervalRef.current = setTimeout(simulateStream, 1000 / streamSpeed[0]);
        }
      };
      
      // Start the simulation process
      simulateStream();
    } else if (intervalRef.current) {
      // Clear any pending timeouts when not streaming
      clearTimeout(intervalRef.current);
      intervalRef.current = null;
    }

    return () => {
      if (intervalRef.current) {
        clearTimeout(intervalRef.current);
      }
    };
  }, [isStreaming, streamSpeed]);

  // Removed automatic data loading on component mount

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearTimeout(intervalRef.current);
      }
    };
  }, []);

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return <ThumbsUp className="h-4 w-4 text-green-600" />;
      case 'negative': return <ThumbsDown className="h-4 w-4 text-red-600" />;
      default: return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'bg-green-100 text-green-800 border-green-200';
      case 'negative': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const pieChartData = [
    { name: 'Positive', value: stats.positive, color: '#22c55e', id: 'positive' },
    { name: 'Negative', value: stats.negative, color: '#ef4444', id: 'negative' },
    { name: 'Neutral', value: stats.neutral, color: '#64748b', id: 'neutral' }
  ].filter(item => item.value > 0);

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h1 className="text-3xl">Live Comment Stream Analyzer</h1>
        <p className="text-muted-foreground">
          Monitor real-time comment streams with dynamic sentiment analysis and live visualizations.
        </p>
      </div>

      {/* Stream Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <span>Stream Controls</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center space-x-4">
            <Button
              onClick={isStreaming ? pauseStream : startStream}
              variant={isStreaming ? "secondary" : "default"}
              className="flex items-center space-x-2"
            >
              {isStreaming ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              <span>{isStreaming ? 'Pause Stream' : 'Start Stream'}</span>
            </Button>
            
            <Button onClick={stopStream} variant="outline">
              <Square className="h-4 w-4 mr-2" />
              Stop & Clear
            </Button>

            <Button onClick={loadSampleData} variant="outline">
              <MessageCircle className="h-4 w-4 mr-2" />
              Load Sample
            </Button>

            <div className="flex items-center space-x-2 ml-auto">
              <div className={`w-3 h-3 rounded-full ${isStreaming ? 'bg-red-500 animate-pulse' : 'bg-gray-400'}`}></div>
              <span className="text-sm text-muted-foreground">
                {isStreaming ? 'Live' : 'Stopped'}
              </span>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <Textarea
              placeholder="Enter your comment here for analysis..."
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              className="w-full"
            />
            <Button 
              onClick={() => {
                if (manualInput.trim()) {
                  addComment(manualInput.trim());
                  setManualInput(""); // Clear after submission
                }
              }}
              variant="default"
              className="w-full"
            >
              Submit Comment
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Stream Speed: {streamSpeed[0]}/5</Label>
              <Slider
                value={streamSpeed}
                onValueChange={setStreamSpeed}
                max={5}
                min={1}
                step={1}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Adjust how frequently new comments appear
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="autoscroll"
                checked={autoScroll}
                onCheckedChange={setAutoScroll}
              />
              <Label htmlFor="autoscroll">Auto-scroll to new comments</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Live Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Comments</p>
                <p className="text-2xl font-medium">{stats.totalComments}</p>
              </div>
              <Users className="h-6 w-6 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Positive</p>
                <p className="text-2xl font-medium text-green-600">{stats.positive}</p>
                <Progress 
                  value={stats.totalComments > 0 ? (stats.positive / stats.totalComments) * 100 : 0} 
                  className="mt-2 h-2"
                />
              </div>
              <ThumbsUp className="h-6 w-6 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Negative</p>
                <p className="text-2xl font-medium text-red-600">{stats.negative}</p>
                <Progress 
                  value={stats.totalComments > 0 ? (stats.negative / stats.totalComments) * 100 : 0} 
                  className="mt-2 h-2"
                />
              </div>
              <ThumbsDown className="h-6 w-6 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Sentiment</p>
                <p className={`text-2xl font-medium ${
                  stats.avgSentiment > 0 ? 'text-green-600' : 
                  stats.avgSentiment < 0 ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {stats.avgSentiment.toFixed(2)}
                </p>
              </div>
              <BarChart3 className="h-6 w-6 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Live Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Sentiment Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={sentimentHistory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis domain={[-1, 1]} />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="sentiment" 
                  stroke="#8884d8" 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Current Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieChartData.map((entry) => (
                    <Cell key={entry.id} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Live Comments Feed */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Live Comments Feed</span>
            <Badge variant={isStreaming ? "default" : "secondary"}>
              {isStreaming ? "Streaming" : "Paused"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div 
            ref={commentsRef}
            className="max-h-[500px] overflow-y-auto space-y-3 border rounded-lg p-4 bg-muted/30"
          >
            {comments.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No comments yet. Start the stream or load sample data.</p>
              </div>
            )}
            
            {comments.map((comment) => (
              <div key={comment.id} className="flex space-x-3 p-3 bg-background rounded-lg border animate-in slide-in-from-top-2">
                <div className="flex-shrink-0">
                  {getSentimentIcon(comment.sentiment)}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-sm">{comment.user}</span>
                      <Badge className={getSentimentColor(comment.sentiment)}>
                        {comment.sentiment}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {comment.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-sm">{comment.text}</p>
                  <div className="text-xs text-muted-foreground">
                    Score: {comment.score.toFixed(2)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}