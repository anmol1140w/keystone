import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { FileText, Sparkles, Copy, Download, RotateCcw } from 'lucide-react';
import { FileUpload } from './ui/file-upload';

// Change this to your Render backend URL
const API_BASE = "https://hf-mediator.onrender.com";

export function CommentSummarizer() {
  const [inputText, setInputText] = useState('');
  const [summary, setSummary] = useState('');
  const [keyPhrases, setKeyPhrases] = useState<string[]>([]);
  const [summaryLength, setSummaryLength] = useState<'short' | 'medium' | 'long'>('medium');
  const [isProcessing, setIsProcessing] = useState(false);

  // --- Call backend summarizer ---
  const handleSummarize = async () => {
  if (!inputText.trim()) return;
  setIsProcessing(true);

  try {
    const response = await fetch(`${API_BASE}/summary`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ comments: inputText.split("\n") }),
    });

    const data = await response.json();

    // Case 1: backend returns { "summary": "{'status': 'success', 'summary': '...'}" }
    let parsedSummary = "";
try {
  if (typeof data.summary === "string") {
    // Try regex to extract 'summary': '...' directly
    const match = data.summary.match(/'summary':\s*'([^']+)'/);
    if (match) {
      parsedSummary = match[1];
    } else {
      // fallback: try JSON parse normalization
      const normalized = data.summary
        .replace(/'/g, '"')
        .replace(/None/g, "null")
        .replace(/True/g, "true")
        .replace(/False/g, "false");

      const inner = JSON.parse(normalized);
      parsedSummary = inner.summary || normalized;
    }
  } else if (typeof data.summary === "object") {
    parsedSummary = data.summary.summary || "";
  } else {
    parsedSummary = String(data.summary);
  }
} catch (err) {
  console.error("Failed to parse inner summary:", err);
  parsedSummary = String(data.summary);
}


    setSummary(parsedSummary);
    setKeyPhrases([]);
  } catch (error) {
    console.error("Error fetching summary:", error);
  } finally {
    setIsProcessing(false);
  }
};


  const handleCopySummary = () => {
    navigator.clipboard.writeText(summary);
  };

  const handleReset = () => {
    setInputText('');
    setSummary('');
    setKeyPhrases([]);
  };

  const getSummaryStats = () => {
    const originalWords = inputText.trim().split(/\s+/).length;
    const summaryWords = summary.trim().split(/\s+/).length;
    const compressionRatio =
      originalWords > 0 ? (((originalWords - summaryWords) / originalWords) * 100).toFixed(1) : 0;

    return { originalWords, summaryWords, compressionRatio };
  };

  const stats = getSummaryStats();

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h1 className="text-3xl">Comment Summarizer</h1>
        <p className="text-muted-foreground">
          Generate concise summaries of public feedback and identify key themes.
        </p>
        <FileUpload 
          onFileUpload={(content) => setInputText(content)}
          label="Upload comments from CSV or Excel file"
        />
      </div>

      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle>Input Comments</CardTitle>
          <CardDescription>
            Paste multiple comments (one per line) to generate a summary
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Enter comments to summarize..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            rows={10}
            className="min-h-[200px]"
          />

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium">Summary Length:</label>
              <Select value={summaryLength} onValueChange={(value: any) => setSummaryLength(value)}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="short">Short</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="long">Long</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex space-x-2">
              <Button variant="outline" onClick={handleReset}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
              <Button onClick={handleSummarize} disabled={!inputText.trim() || isProcessing}>
                <Sparkles className="h-4 w-4 mr-2" />
                {isProcessing ? 'Processing...' : 'Generate Summary'}
              </Button>
            </div>
          </div>

          {inputText && (
            <div className="text-sm text-muted-foreground">
              Input: {inputText.trim().split(/\s+/).length} words, {inputText.length} characters
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Section */}
      {summary && (
        <>
          {/* Summary Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Original Words</p>
                    <p className="text-2xl font-medium">{stats.originalWords}</p>
                  </div>
                  <FileText className="h-6 w-6 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Summary Words</p>
                    <p className="text-2xl font-medium">{stats.summaryWords}</p>
                  </div>
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Compression</p>
                    <p className="text-2xl font-medium">{stats.compressionRatio}%</p>
                  </div>
                  <div className="text-green-600">↓</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Generated Summary */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Generated Summary</CardTitle>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={handleCopySummary}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-muted/30 rounded-lg">
                <p className="leading-relaxed whitespace-pre-line">{summary}</p>
              </div>
            </CardContent>
          </Card>

          {/* Key Phrases */}
          {keyPhrases.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Key Phrases & Themes</CardTitle>
                <CardDescription>
                  Important terms and concepts identified in the comments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {keyPhrases.map((phrase, index) => (
                    <Badge key={index} variant="secondary" className="px-3 py-1">
                      {phrase}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
