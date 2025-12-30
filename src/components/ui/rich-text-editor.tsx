import * as React from "react"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  id?: string
  label?: React.ReactNode
  error?: string
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Enter text...",
  className,
  id,
  label,
  error
}: RichTextEditorProps) {
  const [mode, setMode] = React.useState<'edit' | 'preview'>('edit')

  const renderHTML = (html: string) => {
    return { __html: html }
  }

  return (
    <div className={cn("space-y-2", className)}>
      {label && <Label htmlFor={id}>{label}</Label>}
      
      <div className="border rounded-md overflow-hidden">
        {/* Toolbar */}
        <div className="bg-muted px-3 py-2 border-b flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMode('edit')}
            className={cn(
              "px-3 py-1 text-sm rounded transition-colors",
              mode === 'edit' 
                ? "bg-background shadow-sm font-medium" 
                : "hover:bg-background/50"
            )}
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => setMode('preview')}
            className={cn(
              "px-3 py-1 text-sm rounded transition-colors",
              mode === 'preview' 
                ? "bg-background shadow-sm font-medium" 
                : "hover:bg-background/50"
            )}
          >
            Preview
          </button>
          <div className="ml-auto text-xs text-muted-foreground">
            HTML supported
          </div>
        </div>

        {/* Editor/Preview Area */}
        {mode === 'edit' ? (
          <Textarea
            id={id}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="min-h-[150px] border-0 rounded-none focus-visible:ring-0 resize-none"
            rows={6}
          />
        ) : (
          <div 
            className="min-h-[150px] p-3 prose prose-sm max-w-none"
            dangerouslySetInnerHTML={renderHTML(value || '<p class="text-muted-foreground">No content</p>')}
          />
        )}
      </div>

      {/* Helper text */}
      <div className="flex items-start gap-2 text-xs text-muted-foreground">
        <div className="flex-1">
          Supports HTML tags. For lists use: &lt;ul&gt;&lt;li&gt;Item&lt;/li&gt;&lt;/ul&gt;
        </div>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  )
}
