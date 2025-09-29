import { ChangeEvent, useState } from 'react';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';
import { FileUp, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from './alert';

interface FileUploadProps {
  onFileUpload: (data: string) => void;
  accept?: string;
  label?: string;
}

export function FileUpload({ 
  onFileUpload, 
  accept = ".csv,.xlsx,.xls", 
  label = "Upload CSV or Excel file" 
}: FileUploadProps) {
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    
    if (!file) return;
    
    setFileName(file.name);
    
    // Check file type
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    if (!fileExt || !accept.includes(`.${fileExt}`)) {
      setError(`Invalid file type. Please upload ${accept} files only.`);
      return;
    }
    
    const reader = new FileReader();
    
    reader.onload = (event) => {
      const content = event.target?.result as string;
      onFileUpload(content);
    };
    
    reader.onerror = () => {
      setError('Error reading file. Please try again.');
    };
    
    reader.readAsText(file);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="file-upload">{label}</Label>
      <div className="flex items-center gap-2">
        <Input
          id="file-upload"
          type="file"
          accept={accept}
          onChange={handleFileChange}
          className="hidden"
        />
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => document.getElementById('file-upload')?.click()}
          className="flex items-center gap-2"
        >
          <FileUp className="h-4 w-4" />
          {fileName || 'Choose file'}
        </Button>
        {fileName && (
          <span className="text-sm text-muted-foreground truncate max-w-[200px]">
            {fileName}
          </span>
        )}
      </div>
      
      {error && (
        <Alert variant="destructive" className="mt-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}