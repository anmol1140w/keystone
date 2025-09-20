import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Slider } from './ui/slider';
import { Separator } from './ui/separator';
import { FileText, Sparkles, Copy, Download, RotateCcw } from 'lucide-react';

// Mock summarization function
const summarizeText = (text: string, length: 'short' | 'medium' | 'long' = 'medium') => {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  let targetSentences;
  switch (length) {
    case 'short': targetSentences = Math.max(1, Math.ceil(sentences.length * 0.2)); break;
    case 'medium': targetSentences = Math.max(2, Math.ceil(sentences.length * 0.4)); break;
    case 'long': targetSentences = Math.max(3, Math.ceil(sentences.length * 0.6)); break;
  }
  
  // Simple extractive summarization - pick sentences with key terms
  const keyTerms = ['bill', 'amendment', 'regulation', 'corporate', 'company', 'business', 'compliance', 'governance'];
  
  const scoredSentences = sentences.map((sentence, index) => {
    let score = 0;
    const words = sentence.toLowerCase().split(/\s+/);
    
    // Score based on key terms
    keyTerms.forEach(term => {
      if (words.some(word => word.includes(term))) score += 2;
    });
    
    // Prefer sentences from beginning and end
    if (index < sentences.length * 0.3) score += 1;
    if (index > sentences.length * 0.7) score += 1;
    
    // Prefer longer sentences (more content)
    if (words.length > 10) score += 1;
    
    return { sentence: sentence.trim(), score, index };
  });
  
  const topSentences = scoredSentences
    .sort((a, b) => b.score - a.score)
    .slice(0, targetSentences)
    .sort((a, b) => a.index - b.index);
  
  return topSentences.map(item => item.sentence).join('. ') + '.';
};

// Extract key phrases
const extractKeyPhrases = (text: string) => {
  const words = text.toLowerCase().split(/\s+/);
  const phrases = [];
  
  // Look for important business/legal terms
  const importantTerms = [
    'corporate governance', 'compliance requirements', 'regulatory framework',
    'business operations', 'financial reporting', 'shareholder rights',
    'board responsibilities', 'audit requirements', 'disclosure norms',
    'penalty provisions', 'implementation timeline', 'exemption criteria'
  ];
  
  importantTerms.forEach(term => {
    if (text.toLowerCase().includes(term)) {
      phrases.push(term);
    }
  });
  
  // Extract capitalized phrases (likely important)
  const capitalizedPhrases = text.match(/[A-Z][a-z]+ [A-Z][a-z]+/g) || [];
  phrases.push(...capitalizedPhrases.slice(0, 5));
  
  return [...new Set(phrases)].slice(0, 8);
};

const sampleComments = `
The proposed Companies (Amendment) Bill 2024 introduces significant changes to corporate governance norms and compliance requirements. Many stakeholders have expressed concerns about the increased regulatory burden on small and medium enterprises.

The amendment focuses on strengthening board responsibilities and enhancing transparency in financial reporting. However, the implementation timeline appears too aggressive for companies to adapt their existing systems and processes.

Several industry associations have submitted detailed feedback regarding the penalty provisions which they consider disproportionate to the violations. The new disclosure norms for related party transactions may require extensive system upgrades.

The bill also introduces mandatory ESG reporting for listed companies above a certain threshold. While this aligns with global best practices, concerns have been raised about the availability of standardized reporting frameworks.

Positive aspects include the rationalization of certain compliance procedures and the introduction of digital filing mechanisms. The exemption criteria for small companies have been well-received by the startup ecosystem.

Overall, while the intent to improve corporate governance is appreciated, industry experts suggest a phased implementation approach with adequate transition periods for compliance.
`;

export function CommentSummarizer() {
  const [inputText, setInputText] = useState('');
  const [summary, setSummary] = useState('');
  const [keyPhrases, setKeyPhrases] = useState<string[]>([]);
  const [summaryLength, setSummaryLength] = useState<'short' | 'medium' | 'long'>('medium');
  const [isProcessing, setIsProcessing] = useState(false);
  const [highlightedText, setHighlightedText] = useState('');

  const handleSummarize = async () => {
    if (!inputText.trim()) return;
    
    setIsProcessing(true);
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const generatedSummary = summarizeText(inputText, summaryLength);
    const phrases = extractKeyPhrases(inputText);
    
    setSummary(generatedSummary);
    setKeyPhrases(phrases);
    
    // Highlight key phrases in original text
    let highlighted = inputText;
    phrases.forEach(phrase => {
      const regex = new RegExp(`(${phrase})`, 'gi');
      highlighted = highlighted.replace(regex, '<mark class="bg-yellow-200 px-1 rounded">$1</mark>');
    });
    setHighlightedText(highlighted);
    
    setIsProcessing(false);
  };

  const handleLoadSample = () => {
    setInputText(sampleComments);
  };

  const handleCopySummary = () => {
    navigator.clipboard.writeText(summary);
  };

  const handleReset = () => {
    setInputText('');
    setSummary('');
    setKeyPhrases([]);
    setHighlightedText('');
  };

  const getSummaryStats = () => {
    const originalWords = inputText.trim().split(/\s+/).length;
    const summaryWords = summary.trim().split(/\s+/).length;
    const compressionRatio = originalWords > 0 ? ((originalWords - summaryWords) / originalWords * 100).toFixed(1) : 0;
    
    return { originalWords, summaryWords, compressionRatio };
  };

  const stats = getSummaryStats();

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h1 className="text-3xl">Comment Summarizer</h1>
        <p className="text-muted-foreground">
          Generate concise summaries of public feedback and identify key themes from MCA consultations.
        </p>
      </div>

      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle>Input Comments</CardTitle>
          <CardDescription>
            Paste multiple comments or feedback text to generate a summary
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
            <div className="flex items-center space-x-4">
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
            </div>
            
            <div className="flex space-x-2">
              <Button variant="outline" onClick={handleLoadSample}>
                Load Sample
              </Button>
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
                <p className="leading-relaxed">{summary}</p>
              </div>
            </CardContent>
          </Card>

          {/* Key Phrases */}
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

          {/* Highlighted Original Text */}
          <Card>
            <CardHeader>
              <CardTitle>Original Text with Key Phrases Highlighted</CardTitle>
              <CardDescription>
                Key phrases are highlighted in the original text
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div 
                className="p-4 bg-muted/30 rounded-lg leading-relaxed max-h-[400px] overflow-y-auto"
                dangerouslySetInnerHTML={{ __html: highlightedText }}
              />
            </CardContent>
          </Card>
        </>
      )}

      {/* No results state */}
      {!summary && !isProcessing && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Summary Generated</h3>
            <p className="text-muted-foreground mb-4">
              Enter some comments above and click "Generate Summary" to get started.
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