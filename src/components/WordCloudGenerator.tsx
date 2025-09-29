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
  radius: number;
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
  mixed: ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"],
  gov: ["#1a4480", "#005ea2", "#0b4778", "#2672de", "#73b3e7"]
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
  const [colorScheme, setColorScheme] = useState("gov");
  const [minWordLength, setMinWordLength] = useState([3]);
  const [maxWords, setMaxWords] = useState([10]);
  const [frequencies, setFrequencies] = useState<[string, number][]>([]);
  const [wordCloudData, setWordCloudData] = useState<WordData[]>([]);
  const [maxWordCount, setMaxWordCount] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cloudRef = useRef<HTMLDivElement>(null);

  const generateWordCloud = () => {
    if (!inputText.trim()) return;

    const wordFreqs = getWordFrequency(inputText, removeStopWords)
      .filter(([word]) => word.length >= minWordLength[0])
      .slice(0, maxWords[0]);

    setFrequencies(wordFreqs);

    const maxCount = Math.max(...wordFreqs.map(([, c]) => c));
    setMaxWordCount(maxCount || 1);
    const minSize = 12, maxSize = 36;
    const palette = colors[colorScheme as keyof typeof colors] || colors.mixed;

    cloud()
      .size([1000, 650])
      .words(
        wordFreqs.map(([text, count], i) => {
          const size = minSize + ((count / maxCount) * (maxSize - minSize));
          const approxTextWidth = 0.6 * size * text.length;
          const baseRadius = Math.max(14, size * 1.0);
          const bubbleRadius = Math.max(baseRadius, approxTextWidth / 2 + 10);
          // Cap the radius used for padding to avoid over-spacing large words
          const paddingRadius = Math.min(bubbleRadius, 110);
          const adjustedRadius = Math.max(12, paddingRadius * 0.92);
          return {
            text,
            count,
            size,
            color: palette[i % palette.length],
            radius: adjustedRadius
          } as any;
        })
      )
      // Keep padding modest so multiple bubbles can be placed
      .padding(10)
      .rotate(() => 0)
      .font("Impact")
      .fontSize((d: any) => d.size)
      .on("end", (words: any[]) => {
        const width = 1000, height = 650;
        const halfW = width / 2, halfH = height / 2;

        // Build nodes with explicit radius for collision handling
        const nodes: WordData[] = words.map((w: any) => ({
          text: w.text,
          count: w.count,
          size: w.size,
          color: w.color,
          x: w.x,
          y: w.y,
          rotate: w.rotate,
          radius: w.radius ?? w.bubbleRadius ?? Math.max(14, (w.size || 16) * 1.0)
        }));

        // Collision resolution to avoid overlapping bubbles
        const sim = d3.forceSimulation(nodes as any)
          .force("collide", d3.forceCollide((d: any) => (d.radius || 16) + 6))
          .force("x", d3.forceX(0).strength(0.02))
          .force("y", d3.forceY(0).strength(0.02))
          .stop();

        for (let i = 0; i < 200; i++) sim.tick();

        // Clamp to canvas bounds (coordinates are relative to center)
        nodes.forEach((n) => {
          n.x = Math.max(-halfW + n.radius, Math.min(halfW - n.radius, n.x));
          n.y = Math.max(-halfH + n.radius, Math.min(halfH - n.radius, n.y));
        });

        setWordCloudData(nodes);
      })
      .start();
  };

  const handleLoadSample = () => setInputText(sampleText);
  const handleReset = () => {
    setInputText("");
    setWordCloudData([]);
    setFrequencies([]);
  };

  const handleUploadDatasetClick = () => {
    fileInputRef.current?.click();
  };

  const handleUploadDatasetChange = async (e: import("react").ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const raw = await file.text();
    let combined = "";
    try {
      const json = JSON.parse(raw);
      if (Array.isArray(json)) {
        combined = json
          .map((item) => {
            if (typeof item === "string") return item;
            if (item && typeof item === "object" && "text" in item) return (item as any).text || "";
            return "";
          })
          .join(" \n ");
      } else {
        combined = raw; // fallback to raw text
      }
    } catch {
      combined = raw; // not JSON, treat as plain text/CSV
    }
    setInputText(combined);
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
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.csv,.json"
                className="hidden"
                onChange={handleUploadDatasetChange}
              />
              <Button variant="outline" onClick={handleUploadDatasetClick}>
                <Upload className="h-4 w-4 mr-2" /> Upload Dataset
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
                <SelectItem value="gov">Government</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Min Word Length: {minWordLength[0]}</Label>
            <Slider value={minWordLength} onValueChange={setMinWordLength} max={8} min={2} step={1} />
          </div>
          <div className="space-y-2">
            <Label>Max Words: {maxWords[0]}</Label>
            <Slider value={maxWords} onValueChange={setMaxWords} max={15} min={1} step={1} />
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
            <div ref={cloudRef} className="relative w-full h-[650px] bg-muted/20 border rounded overflow-hidden flex items-center justify-center">
              <svg width={1000} height={650}>
                <g transform="translate(500,325)">
                  {wordCloudData.map((word, i) => {
                    const fontSize = word.size;
                    const r = word.radius || Math.max(14, fontSize * 1.0);
                    const density = Math.max(0.1, word.count / maxWordCount);
                    // Professional gov-style: moderate brightening for clean, accessible contrast
                    const centerFill = (d3.color(word.color)?.brighter(2.0 + (1.0 - density) * 2.0)?.formatHex()) || word.color;
                    const edgeFill = (d3.color(word.color)?.brighter(1.0 + (1.0 - density) * 1.0)?.formatHex()) || word.color;
                    const gradId = `bubble-grad-${i}`;
                    const floatDuration = 7 + (i % 5) * 1.2;
                    const floatDelay = -(i % 7) * 0.4;
                    const filterId = `droplet-filter-${i}`;
                    const centerOpacity = 0.9 - (density * 0.15);
                    const edgeOpacity = 0.55 - (density * 0.1);
                    return (
                      <g
                        key={i}
                        transform={`translate(${word.x},${word.y}) rotate(${word.rotate})`}
                        className="transition-transform hover:scale-105"
                        title={`${word.text}: ${word.count}`}
                      >
                        <defs>
                          <radialGradient id={gradId} cx="50%" cy="40%" r="75%">
                            <stop offset="0%" stopColor={centerFill} stopOpacity={centerOpacity} />
                            <stop offset="100%" stopColor={edgeFill} stopOpacity={edgeOpacity} />
                          </radialGradient>
                          {/* Glassy droplet specular highlight */}
                          <filter id={filterId} x="-50%" y="-50%" width="200%" height="200%">
                            <feGaussianBlur in="SourceAlpha" stdDeviation="2" result="blur" />
                            <feSpecularLighting in="blur" surfaceScale="2" specularConstant="0.6" specularExponent="18" lighting-color="#ffffff" result="spec">
                              <fePointLight x="-30" y="-30" z="60" />
                            </feSpecularLighting>
                            <feComposite in="spec" in2="SourceAlpha" operator="in" result="specOut" />
                            <feMerge>
                              <feMergeNode in="SourceGraphic" />
                              <feMergeNode in="specOut" />
                            </feMerge>
                          </filter>
                        </defs>
                        <g
                          className="bubble-float"
                          style={{
                            animationDuration: `${floatDuration}s`,
                            animationDelay: `${floatDelay}s`,
                            transformOrigin: "center center",
                          }}
                          filter={`url(#${filterId})`}
                        >
                          <circle
                            r={r}
                            fill={`url(#${gradId})`}
                            opacity="1"
                            stroke="rgba(0,0,0,0.06)"
                            strokeWidth={1 + density * 1.5}
                            style={{ filter: `drop-shadow(0 6px 12px rgba(0,0,0,${0.09 + density * 0.14}))` }}
                          />
                          {/* highlight */}
                          <circle
                            r={r * 0.4}
                            cx={-r * 0.35}
                            cy={-r * 0.35}
                            fill="#ffffff"
                            opacity={0.16 + (1.0 - density) * 0.16}
                          />
                          {/* glossy arc highlight */}
                          <ellipse
                            rx={r * 0.55}
                            ry={r * 0.32}
                            cx={-r * 0.2}
                            cy={-r * 0.55}
                            fill="#ffffff"
                            opacity={0.10 + (1.0 - density) * 0.12}
                          />
                          <text
                            textAnchor="middle"
                            dy="0.35em"
                            style={{
                              fontSize: Math.min(fontSize, r * 0.95),
                              fill: "#000000",
                              fontFamily:
                                "Inter, system-ui, -apple-system, Segoe UI, Roboto, 'Helvetica Neue', Arial",
                              fontWeight: density > 0.7 ? 800 : 700,
                              pointerEvents: "none"
                            }}
                          >
                            {word.text}
                          </text>
                        </g>
                      </g>
                    );
                  })}
              </g>
            </svg>
          </div>
            <div className="mt-2 flex items-center space-x-4 text-xs text-muted-foreground">
              <div className="flex items-center space-x-2">
              <span className="inline-block h-3 w-3 rounded-full" style={{ background: '#73b3e7', boxShadow: '0 0 0 1px rgba(0,0,0,0.15)' }}></span>
              <span>Lower density</span>
              </div>
              <div className="flex items-center space-x-2">
              <span className="inline-block h-3 w-3 rounded-full" style={{ background: '#1a4480', boxShadow: '0 0 0 2px rgba(0,0,0,0.25)' }}></span>
              <span>Higher density</span>
              </div>
              <span>Size and color intensity reflect word frequency</span>
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
