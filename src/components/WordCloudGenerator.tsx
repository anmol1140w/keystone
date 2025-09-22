// WordCloudGenerator.tsx
import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import { Slider } from "./ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Badge } from "./ui/badge";
import { Cloud, Download, RotateCcw, Settings, Upload } from "lucide-react";
import * as d3 from "d3";
import cloud from "d3-cloud";
import html2canvas from "html2canvas";

// Stopwords
const stopWords = new Set([
  "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with", "by",
  "is", "are", "was", "were", "be", "been", "being", "have", "has", "had", "do", "does", "did",
  "will", "would", "could", "should", "may", "might", "must", "can", "this", "that", "these",
  "those", "i", "you", "he", "she", "it", "we", "they", "me", "him", "her", "us", "them",
  "my", "your", "his", "her", "its", "our", "their", "am", "as", "if", "so", "than", "very"
]);

interface WordData {
  text: string;
  count: number;
  size: number;
  color: string;
  x: number;
  y: number;
  rotate: number;
}

const getWordFrequency = (text: string, removeStopWords: boolean) => {
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2);

  const filteredWords = removeStopWords
    ? words.filter((word) => !stopWords.has(word))
    : words;

  const frequency: { [key: string]: number } = {};
  filteredWords.forEach((word) => {
    frequency[word] = (frequency[word] || 0) + 1;
  });

  return Object.entries(frequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 100);
};

const colors = {
  blue: ["#3b82f6", "#1d4ed8", "#2563eb", "#1e40af", "#1e3a8a"],
  green: ["#10b981", "#059669", "#047857", "#065f46", "#064e3b"],
  purple: ["#8b5cf6", "#7c3aed", "#6d28d9", "#5b21b6", "#4c1d95"],
  orange: ["#f97316", "#ea580c", "#dc2626", "#b91c1c", "#991b1b"],
  mixed: ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"]
};

const sampleText = `
Corporate governance transparency accountability compliance regulatory framework business operations 
financial reporting shareholder rights board responsibilities audit requirements disclosure norms 
penalty provisions implementation timeline exemption criteria small companies startup ecosystem 
ESG reporting listed companies standardized frameworks digital filing mechanisms related party 
transactions system upgrades industry associations stakeholder feedback phased implementation 
transition periods best practices rationalization procedures amendment bill governance norms 
regulatory burden medium enterprises strengthening board enhancing transparency aggressive timeline 
existing systems processes detailed feedback disproportionate violations extensive upgrades 
mandatory reporting threshold global practices availability frameworks positive aspects 
rationalization compliance procedures introduction digital mechanisms exemption criteria 
well-received startup ecosystem overall intent improve governance appreciated industry experts 
suggest phased approach adequate periods compliance Ministry Corporate Affairs draft bills 
public consultation comments analysis sentiment summarization word cloud visualization
`;

export function WordCloudGenerator() {
  const [inputText, setInputText] = useState("");
  const [removeStopWords, setRemoveStopWords] = useState(true);
  const [colorScheme, setColorScheme] = useState("mixed");
  const [minWordLength, setMinWordLength] = useState([3]);
  const [maxWords, setMaxWords] = useState([50]);
  const [frequencies, setFrequencies] = useState<[string, number][]>([]);
  const [wordCloudData, setWordCloudData] = useState<WordData[]>([]);
  const cloudRef = useRef<HTMLDivElement>(null);

  const generateWordCloud = () => {
    if (!inputText.trim()) return;

    const wordFreqs = getWordFrequency(inputText, removeStopWords)
      .filter(([word]) => word.length >= minWordLength[0])
      .slice(0, maxWords[0]);

    setFrequencies(wordFreqs);

    const maxCount = Math.max(...wordFreqs.map(([, c]) => c));
    const minSize = 15, maxSize = 60;
    const palette = colors[colorScheme as keyof typeof colors] || colors.mixed;

    cloud()
      .size([600, 400])
      .words(
        wordFreqs.map(([text, count], i) => ({
          text,
          count,
          size: minSize + ((count / maxCount) * (maxSize - minSize)),
          color: palette[i % palette.length]
        }))
      )
      .padding(5)
      .rotate(() => (Math.random() > 0.5 ? 0 : 90))
      .font("Impact")
      .fontSize((d: any) => d.size)
      .on("end", (words: any[]) => {
        setWordCloudData(
          words.map((w) => ({
            text: w.text,
            count: w.count,
            size: w.size,
            color: w.color,
            x: w.x,
            y: w.y,
            rotate: w.rotate
          }))
        );
      })
      .start();
  };

  const handleLoadSample = () => setInputText(sampleText);
  const handleReset = () => {
    setInputText("");
    setWordCloudData([]);
    setFrequencies([]);
  };

  const handleExport = async () => {
    if (cloudRef.current) {
      const canvas = await html2canvas(cloudRef.current);
      const link = document.createElement("a");
      link.download = "wordcloud.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    }
  };

  useEffect(() => {
    if (inputText) {
      generateWordCloud();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [removeStopWords, colorScheme, minWordLength, maxWords]);

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h1 className="text-3xl">Word Cloud Generator</h1>
        <p className="text-muted-foreground">
          Create visual representations of frequently mentioned terms.
        </p>
      </div>

      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle>Input Text</CardTitle>
          <CardDescription>Enter comments or feedback text</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Enter text..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            rows={6}
          />
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {inputText ? `${inputText.trim().split(/\s+/).length} words` : "No text entered"}
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={handleLoadSample}>
                <Upload className="h-4 w-4 mr-2" /> Load Sample
              </Button>
              <Button variant="outline" onClick={handleReset}>
                <RotateCcw className="h-4 w-4 mr-2" /> Reset
              </Button>
              <Button onClick={generateWordCloud} disabled={!inputText.trim()}>
                <Cloud className="h-4 w-4 mr-2" /> Generate Cloud
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" /> <span>Settings</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Switch id="stopwords" checked={removeStopWords} onCheckedChange={setRemoveStopWords} />
              <Label htmlFor="stopwords">Remove stop words</Label>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Color Scheme</Label>
            <Select value={colorScheme} onValueChange={setColorScheme}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="mixed">Mixed</SelectItem>
                <SelectItem value="blue">Blue</SelectItem>
                <SelectItem value="green">Green</SelectItem>
                <SelectItem value="purple">Purple</SelectItem>
                <SelectItem value="orange">Orange</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Min Word Length: {minWordLength[0]}</Label>
            <Slider value={minWordLength} onValueChange={setMinWordLength} max={8} min={2} step={1} />
          </div>
          <div className="space-y-2">
            <Label>Max Words: {maxWords[0]}</Label>
            <Slider value={maxWords} onValueChange={setMaxWords} max={100} min={10} step={5} />
          </div>
        </CardContent>
      </Card>

      {/* Word Cloud */}
      {wordCloudData.length > 0 && (
        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Word Cloud</CardTitle>
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" /> Export PNG
            </Button>
          </CardHeader>
          <CardContent>
            <div ref={cloudRef} className="relative w-full h-[400px] bg-muted/20 border rounded overflow-hidden flex items-center justify-center">
              <svg width={600} height={400}>
                <g transform="translate(300,200)">
                  {wordCloudData.map((word, i) => (
                    <text
                      key={i}
                      textAnchor="middle"
                      transform={`translate(${word.x},${word.y}) rotate(${word.rotate})`}
                      style={{
                        fontSize: word.size,
                        fill: word.color,
                        fontFamily: "Impact",
                        cursor: "pointer",
                        fontWeight: "bold"
                      }}
                      title={`${word.text}: ${word.count}`}
                    >
                      {word.text}
                    </text>
                  ))}
                </g>
              </svg>
            </div>
          </CardContent>
        </Card>
      )}


      {/* Word Frequency Table */}
      {frequencies.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Word Frequencies</CardTitle>
            <CardDescription>Most common words</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-[300px] overflow-y-auto">
              {frequencies.slice(0, 20).map(([word, count]) => (
                <div key={word} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                  <span>{word}</span>
                  <Badge variant="secondary">{count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
