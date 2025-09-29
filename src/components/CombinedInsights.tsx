import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Separator } from './ui/separator';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { 
  TrendingUp, FileText, Cloud, BarChart3, Download, Upload, 
  ThumbsUp, ThumbsDown, Minus, Sparkles, RefreshCw 
} from 'lucide-react';

// Backend API base (FastAPI)
const API_BASE = "https://hf-mediator.onrender.com";

// Heuristic word frequency (local)

const getWordFrequency = (text: string) => {
  const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']);
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word));
  
  const frequency: { [key: string]: number } = {};
  words.forEach(word => {
    frequency[word] = (frequency[word] || 0) + 1;
  });
  
  return Object.entries(frequency)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 20);
};

const sampleComments = [
  "This bill is excellent and will greatly benefit small businesses. The new provisions for digital filing are particularly helpful.",
  "I oppose this amendment as it creates unnecessary burden on companies. The compliance costs will be too high for startups.",
  "The proposed changes seem reasonable and balanced. However, more clarity needed on implementation timeline and procedures.",
  "This is a terrible idea that will destroy our industry. The penalty provisions are disproportionate to violations.",
  "Great step forward for corporate governance! This will improve transparency and accountability in business operations.",
  "I have concerns about the compliance costs but understand the need for better regulations and oversight mechanisms.",
  "Strongly support this bill. It addresses long-standing issues in corporate sector and aligns with global best practices.",
  "The implementation seems rushed. More consultation with industry stakeholders needed before finalizing these changes.",
  "This amendment is well-drafted and addresses key concerns of business community while maintaining regulatory balance.",
  "Unclear about practical implications. More detailed guidelines and exemptions for small companies are necessary."
];

export function CombinedInsights() {
  const [inputText, setInputText] = useState('');
  const [analysisResults, setAnalysisResults] = useState<{
    sentiment: any;
    summary: string;
    wordFreq: [string, number][];
    comments: any[];
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // --- Helpers: backend calls ---
  const lexicalScore = (text: string) => {
    const words = text.toLowerCase().split(/\s+/);
    let score = 0;
    const positiveWords = ['good', 'excellent', 'great', 'support', 'beneficial', 'positive', 'agree', 'helpful', 'useful', 'improvement'];
    const negativeWords = ['bad', 'terrible', 'oppose', 'against', 'negative', 'disagree', 'harmful', 'useless', 'wrong', 'problem'];
    words.forEach(word => {
      if (positiveWords.includes(word)) score += 1;
      if (negativeWords.includes(word)) score -= 1;
    });
    return score;
  };

  async function fetchBackendSentiment(comments: string[]) {
    try {
      const response = await fetch(`${API_BASE}/sentiment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comments })
      });
      const result = await response.json();
      const rows: any[] = result?.data?.data || [];

      const analyzedComments = comments.map((text, i) => {
        const row = rows[i] || [];
        const sentiment = String((row[1] ?? 'neutral')).toLowerCase();
        // optional confidence parsing if needed later
        // const confidence = parseFloat((row[2]?.replace('%', '') ?? 0)) / 100;
        return {
          id: i,
          text,
          sentiment,
          score: lexicalScore(text)
        };
      });

      const sentimentStats = {
        positive: analyzedComments.filter(c => c.sentiment === 'positive').length,
        negative: analyzedComments.filter(c => c.sentiment === 'negative').length,
        neutral: analyzedComments.filter(c => c.sentiment === 'neutral').length,
        total: analyzedComments.length
      };

      return { analyzedComments, sentimentStats };
    } catch (err) {
      console.error('Error fetching backend sentiment:', err);
      const analyzedComments = comments.map((text, i) => ({ id: i, text, sentiment: 'neutral', score: 0 }));
      const sentimentStats = { positive: 0, negative: 0, neutral: analyzedComments.length, total: analyzedComments.length };
      return { analyzedComments, sentimentStats };
    }
  }

  async function fetchBackendSummary(comments: string[]) {
    try {
      const response = await fetch(`${API_BASE}/summary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comments })
      });
      const data = await response.json();

      // Robust parsing similar to CommentSummarizer
      let parsedSummary = '';
      try {
        if (typeof data.summary === 'string') {
          const match = data.summary.match(/'summary':\s*'([^']+)'/);
          if (match) {
            parsedSummary = match[1];
          } else {
            const normalized = data.summary
              .replace(/'/g, '"')
              .replace(/None/g, 'null')
              .replace(/True/g, 'true')
              .replace(/False/g, 'false');
            const inner = JSON.parse(normalized);
            parsedSummary = inner.summary || normalized;
          }
        } else if (typeof data.summary === 'object') {
          parsedSummary = data.summary.summary || '';
        } else {
          parsedSummary = String(data.summary);
        }
      } catch (err) {
        console.error('Failed to parse backend summary:', err);
        parsedSummary = String(data.summary);
      }

      return parsedSummary;
    } catch (err) {
      console.error('Error fetching backend summary:', err);
      return '';
    }
  }

  const handleAnalyze = async () => {
    if (!inputText.trim()) return;

    setIsProcessing(true);
    try {
      // Split into individual comments (by line breaks)
      const comments = inputText
        .split(/\n+/)
        .map(l => l.trim())
        .filter(l => l.length > 0);

      const [sentimentRes, summaryText] = await Promise.all([
        fetchBackendSentiment(comments),
        fetchBackendSummary(comments)
      ]);

      const wordFreq = getWordFrequency(inputText);

      setAnalysisResults({
        sentiment: sentimentRes.sentimentStats,
        summary: summaryText,
        wordFreq,
        comments: sentimentRes.analyzedComments
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLoadSample = () => {
    setInputText(sampleComments.join('\n\n'));
  };

  const handleReset = () => {
    setInputText('');
    setAnalysisResults(null);
  };

  const handleExportReport = () => {
    if (!analysisResults) return;
    
    const report = {
      timestamp: new Date().toISOString(),
      analysis: analysisResults,
      inputText: inputText
    };
    
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'comment-analysis-report.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const sentimentChartData = analysisResults ? [
    { name: 'Positive', value: analysisResults.sentiment.positive, color: '#22c55e' },
    { name: 'Negative', value: analysisResults.sentiment.negative, color: '#ef4444' },
    { name: 'Neutral', value: analysisResults.sentiment.neutral, color: '#64748b' }
  ] : [];

  const wordFreqChartData = analysisResults ? 
    analysisResults.wordFreq.slice(0, 10).map(([word, count]) => ({ word, count })) : [];

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h1 className="text-3xl">Combined Comment Insights</h1>
        <p className="text-muted-foreground">
          Comprehensive analysis combining sentiment analysis, summarization, and word frequency analysis.
        </p>
      </div>

      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle>Input Comments for Analysis</CardTitle>
          <CardDescription>
            Enter multiple comments separated by line breaks for comprehensive analysis
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Enter comments for comprehensive analysis..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            rows={8}
            className="min-h-[200px]"
          />
          
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {inputText ? `${inputText.trim().split(/\s+/).length} words, ${inputText.split(/\n\n/).filter(l => l.trim()).length} comments` : 'No input'}
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={handleLoadSample} disabled={isProcessing}>
                <Upload className="h-4 w-4 mr-2" />
                Load Sample Data
              </Button>
              <Button variant="outline" onClick={handleReset}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Reset
              </Button>
              <Button onClick={handleAnalyze} disabled={!inputText.trim() || isProcessing}>
                <TrendingUp className="h-4 w-4 mr-2" />
                {isProcessing ? 'Analyzing...' : 'Analyze All'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Processing State */}
      {isProcessing && (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="text-lg font-medium">Processing Comments...</p>
              <p className="text-sm text-muted-foreground">Analyzing sentiment, generating summary, and extracting keywords</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {analysisResults && !isProcessing && (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Comments</p>
                    <p className="text-2xl font-medium">{analysisResults.sentiment.total}</p>
                  </div>
                  <FileText className="h-6 w-6 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Positive</p>
                    <p className="text-2xl font-medium text-green-600">{analysisResults.sentiment.positive}</p>
                    <Progress 
                      value={(analysisResults.sentiment.positive / analysisResults.sentiment.total) * 100} 
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
                    <p className="text-2xl font-medium text-red-600">{analysisResults.sentiment.negative}</p>
                    <Progress 
                      value={(analysisResults.sentiment.negative / analysisResults.sentiment.total) * 100} 
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
                    <p className="text-sm text-muted-foreground">Neutral</p>
                    <p className="text-2xl font-medium text-gray-600">{analysisResults.sentiment.neutral}</p>
                    <Progress 
                      value={(analysisResults.sentiment.neutral / analysisResults.sentiment.total) * 100} 
                      className="mt-2 h-2"
                    />
                  </div>
                  <Minus className="h-6 w-6 text-gray-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabbed Analysis Results */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Analysis Results</CardTitle>
                <Button onClick={handleExportReport}>
                  <Download className="h-4 w-4 mr-2" />
                  Export Report
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="sentiment">Sentiment</TabsTrigger>
                  <TabsTrigger value="summary">Summary</TabsTrigger>
                  <TabsTrigger value="keywords">Keywords</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Sentiment Distribution</h3>
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie
                            data={sentimentChartData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {sentimentChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Key Insights</h3>
                      <div className="space-y-3">
                        <div className="p-4 bg-muted/30 rounded-lg">
                          <h4 className="font-medium mb-2">Overall Sentiment</h4>
                          <p className="text-sm text-muted-foreground">
                            {analysisResults.sentiment.positive > analysisResults.sentiment.negative
                              ? "Majority of comments are positive, indicating general support for the proposal."
                              : analysisResults.sentiment.negative > analysisResults.sentiment.positive
                              ? "Majority of comments are negative, indicating concerns about the proposal."
                              : "Comments are evenly split between positive and negative sentiment."
                            }
                          </p>
                        </div>
                        
                        <div className="p-4 bg-muted/30 rounded-lg">
                          <h4 className="font-medium mb-2">Engagement Level</h4>
                          <p className="text-sm text-muted-foreground">
                            Total of {analysisResults.sentiment.total} comments analyzed with 
                            {" " + ((analysisResults.sentiment.positive + analysisResults.sentiment.negative) / analysisResults.sentiment.total * 100).toFixed(0)}% 
                            showing strong sentiment (positive or negative).
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="sentiment" className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Individual Comment Analysis</h3>
                    <div className="max-h-[400px] overflow-y-auto space-y-3">
                      {analysisResults.comments.map((comment) => (
                        <div key={comment.id} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <Badge 
                              className={
                                comment.sentiment === 'positive' ? 'bg-green-100 text-green-800' :
                                comment.sentiment === 'negative' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }
                            >
                              {comment.sentiment.toUpperCase()}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              Score: {comment.score}
                            </span>
                          </div>
                          <p className="text-sm">{comment.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="summary" className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Generated Summary</h3>
                    <div className="p-6 bg-muted/30 rounded-lg">
                      <p className="leading-relaxed">{analysisResults.summary}</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                      <div className="text-center p-4 bg-muted/30 rounded-lg">
                        <p className="text-2xl font-medium">{inputText.trim().split(/\s+/).length}</p>
                        <p className="text-sm text-muted-foreground">Original Words</p>
                      </div>
                      <div className="text-center p-4 bg-muted/30 rounded-lg">
                        <p className="text-2xl font-medium">{analysisResults.summary.trim().split(/\s+/).length}</p>
                        <p className="text-sm text-muted-foreground">Summary Words</p>
                      </div>
                      <div className="text-center p-4 bg-muted/30 rounded-lg">
                        <p className="text-2xl font-medium">
                          {(((inputText.trim().split(/\s+/).length - analysisResults.summary.trim().split(/\s+/).length) / inputText.trim().split(/\s+/).length) * 100).toFixed(0)}%
                        </p>
                        <p className="text-sm text-muted-foreground">Compression</p>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="keywords" className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Top Keywords</h3>
                      <div className="space-y-2">
                        {analysisResults.wordFreq.slice(0, 15).map(([word, count]) => (
                          <div key={word} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                            <span className="font-medium">{word}</span>
                            <Badge variant="secondary">{count}</Badge>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Keyword Frequency Chart</h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={wordFreqChartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="word" angle={-45} textAnchor="end" height={80} />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="count" fill="#8884d8" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </>
      )}

      {/* No results state */}
      {!analysisResults && !isProcessing && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Analysis Results</h3>
            <p className="text-muted-foreground mb-4">
              Enter comments above and click "Analyze All" to generate comprehensive insights.
            </p>
            <Button variant="outline" onClick={handleLoadSample}>
              Try Sample Data
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}