import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Progress } from './ui/progress';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { ThumbsUp, ThumbsDown, Minus, Upload, Filter } from 'lucide-react';

// Backend URL
const BACKEND_URL = "https://hf-mediator.onrender.com";

// --- API call ---
async function analyzeSentiment(text: string) {
  try {
    const response = await fetch(`${BACKEND_URL}/sentiment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ comments: [text] })
    });

    const result = await response.json();
    const rows: any[] = result?.data?.data || [];

    if (rows.length === 0) {
      return { sentiment: "neutral", score: 0, confidence: 0, normalizedScore: 0 };
    }

    const row = rows[0];
    const sentiment = (row[1] ?? "neutral").toLowerCase();
    const confidence = parseFloat((row[2]?.replace("%", "") ?? 0)) / 100;

    const words = text.toLowerCase().split(/\s+/);
    let score = 0;
    const positiveWords = ['good', 'excellent', 'great', 'support', 'beneficial', 'positive', 'agree', 'helpful', 'useful', 'improvement'];
    const negativeWords = ['bad', 'terrible', 'oppose', 'against', 'negative', 'disagree', 'harmful', 'useless', 'wrong', 'problem'];

    words.forEach(word => {
      if (positiveWords.includes(word)) score += 1;
      if (negativeWords.includes(word)) score -= 1;
    });

    return {
      sentiment,
      score,
      confidence,
      normalizedScore: Math.max(-1, Math.min(1, score / words.length * 5))
    };

  } catch (err) {
    console.error("Error fetching sentiment:", err);
    return { sentiment: "neutral", score: 0, confidence: 0, normalizedScore: 0 };
  }
}

// --- Sample comments ---
const sampleComments = [
  "This bill is excellent and will greatly benefit small businesses. I fully support this initiative.",
  "I oppose this amendment as it creates unnecessary burden on companies and may harm economic growth.",
  "The proposed changes seem reasonable and balanced. Need more clarity on implementation timeline.",
  "This is a terrible idea that will destroy our industry. Please reconsider this harmful legislation.",
  "Great step forward! This will improve transparency and accountability in corporate governance.",
  "I have concerns about the compliance costs but understand the need for better regulations.",
  "Strongly support this bill. It addresses long-standing issues in the corporate sector effectively.",
  "The implementation seems rushed. More consultation with stakeholders is needed before passing.",
  "This amendment is well-drafted and addresses key concerns of the business community.",
  "Unclear about the practical implications. More detailed guidelines are necessary."
];

export function SentimentDashboard() {
  const [inputText, setInputText] = useState('');
  const [comments, setComments] = useState<Array<{
    id: string;
    text: string;
    sentiment: string;
    score: number;
    confidence: number;
    normalizedScore: number;
  }>>([]);
  const [filter, setFilter] = useState('all');

  // --- Load sample comments on mount ---
  // useEffect(() => {
  //   const loadSamples = async () => {
  //     const sample = sampleComments.slice(0, 5);
  //     const results = await Promise.all(sample.map(c => analyzeSentiment(c)));
  //     const newComments = sample.map((text, i) => ({
  //       id: `${i}-${Math.random()}`,
  //       text,
  //       ...results[i]
  //     }));
  //     setComments(newComments);
  //   };
  //   loadSamples();
  // }, []);

  // --- Single/multi-line input analysis ---
  const handleAnalyze = async () => {
    if (!inputText.trim()) return;

    const lines = inputText.split('\n').map(l => l.trim()).filter(l => l);
    const results = await Promise.all(lines.map(line => analyzeSentiment(line)));

    const newComments = lines.map((line, i) => ({
      id: `${comments.length + i}-${Math.random()}`,
      text: line,
      ...results[i]
    }));

    setComments(prev => [...newComments, ...prev]);
    setInputText('');
  };

  // --- Bulk upload ---
  const handleBulkUpload = async () => {
    const sample = sampleComments.slice(0, 5);
    const results = await Promise.all(sample.map(c => analyzeSentiment(c)));

    const newComments = sample.map((text, i) => ({
      id: `${comments.length + i}-${Math.random()}`,
      text,
      ...results[i]
    }));

    setComments(prev => [...newComments, ...prev]);
  };

  const filteredComments = comments.filter(c => filter === 'all' || c.sentiment === filter);

  const sentimentStats = {
    positive: comments.filter(c => c.sentiment === 'positive').length,
    negative: comments.filter(c => c.sentiment === 'negative').length,
    neutral: comments.filter(c => c.sentiment === 'neutral').length,
    total: comments.length
  };

  const chartData = [
    { name: 'Positive', value: sentimentStats.positive, color: '#22c55e' },
    { name: 'Negative', value: sentimentStats.negative, color: '#ef4444' },
    { name: 'Neutral', value: sentimentStats.neutral, color: '#64748b' }
  ];

  const timeSeriesData = comments.slice(0, 10).reverse().map((c, i) => ({
    id: i + 1,
    sentiment: c.normalizedScore,
    type: c.sentiment
  }));

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <h1 className="text-3xl">Sentiment Analysis Dashboard</h1>
        <p className="text-muted-foreground">
          Analyze the emotional tone of public comments on MCA draft bills and regulations.
        </p>
      </div>

      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle>Analyze Comments</CardTitle>
          <CardDescription>Paste comments below (one per line) or upload sample data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Enter comments (each line is a separate comment)..."
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            rows={4}
          />
          <div className="flex space-x-2">
            <Button onClick={handleAnalyze} disabled={!inputText.trim()}>Analyze Sentiment</Button>
            <Button variant="outline" onClick={handleBulkUpload}>
              <Upload className="h-4 w-4 mr-2" />Load Sample Data
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6 flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground">Total Comments</p>
              <p className="text-2xl font-medium">{sentimentStats.total}</p>
            </div>
            <Filter className="h-6 w-6 text-primary" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground">Positive</p>
              <p className="text-2xl font-medium text-green-600">{sentimentStats.positive}</p>
              <Progress value={(sentimentStats.positive / sentimentStats.total) * 100} className="mt-2 h-2" />
            </div>
            <ThumbsUp className="h-6 w-6 text-green-600" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground">Negative</p>
              <p className="text-2xl font-medium text-red-600">{sentimentStats.negative}</p>
              <Progress value={(sentimentStats.negative / sentimentStats.total) * 100} className="mt-2 h-2" />
            </div>
            <ThumbsDown className="h-6 w-6 text-red-600" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground">Neutral</p>
              <p className="text-2xl font-medium text-gray-600">{sentimentStats.neutral}</p>
              <Progress value={(sentimentStats.neutral / sentimentStats.total) * 100} className="mt-2 h-2" />
            </div>
            <Minus className="h-6 w-6 text-gray-600" />
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Sentiment Distribution</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Sentiment Trend</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="id" />
                <YAxis domain={[-1, 1]} />
                <Tooltip />
                <Bar dataKey="sentiment" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Comments List */}
      <Card>
        <CardHeader className="flex justify-between items-center">
          <CardTitle>Analyzed Comments</CardTitle>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by sentiment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Comments</SelectItem>
              <SelectItem value="positive">Positive Only</SelectItem>
              <SelectItem value="negative">Negative Only</SelectItem>
              <SelectItem value="neutral">Neutral Only</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-h-[400px] overflow-y-auto">
            {filteredComments.map(comment => (
              <div key={comment.id} className="p-4 border rounded-lg space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    {getSentimentIcon(comment.sentiment)}
                    <Badge className={getSentimentColor(comment.sentiment)}>
                      {comment.sentiment.toUpperCase()}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      Score: {comment.normalizedScore.toFixed(2)}
                    </span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    Confidence: {(comment.confidence * 100).toFixed(1)}%
                  </span>
                </div>
                <p className="text-sm">{comment.text}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
