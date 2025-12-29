import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Bold, Italic, Strikethrough, List, ListOrdered, Heading2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface EditorProps {
  value: string
  onChange: (value: string) => void
}

const Editor = ({ value, onChange }: EditorProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
      }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose-base dark:prose-invert focus:outline-none max-w-none min-h-[150px] px-3 py-2',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
  })

  if (!editor) {
    return null
  }

  const ToggleButton = ({
    isActive,
    onClick,
    children,
    label
  }: {
    isActive: boolean;
    onClick: () => void;
    children: React.ReactNode;
    label: string
  }) => (
    <Button
      variant="ghost"
      size="sm"
      onClick={(e) => { e.preventDefault(); onClick(); }}
      className={cn("h-8 w-8 p-0", isActive && "bg-muted text-foreground")}
      aria-label={label}
      type="button"
    >
      {children}
    </Button>
  )

  return (
    <div className="border rounded-md bg-background">
      <div className="flex items-center gap-1 border-b p-1 bg-muted/20">
        <ToggleButton
          isActive={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
          label="Toggle bold"
        >
          <Bold className="h-4 w-4" />
        </ToggleButton>

        <ToggleButton
          isActive={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          label="Toggle italic"
        >
          <Italic className="h-4 w-4" />
        </ToggleButton>

        <ToggleButton
          isActive={editor.isActive('strike')}
          onClick={() => editor.chain().focus().toggleStrike().run()}
          label="Toggle strikethrough"
        >
          <Strikethrough className="h-4 w-4" />
        </ToggleButton>

        <div className="w-px h-6 bg-border mx-1" />

        <ToggleButton
          isActive={editor.isActive('heading', { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          label="Toggle Heading 2"
        >
          <Heading2 className="h-4 w-4" />
        </ToggleButton>

        <div className="w-px h-6 bg-border mx-1" />

        <ToggleButton
          isActive={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          label="Toggle bullet list"
        >
          <List className="h-4 w-4" />
        </ToggleButton>

        <ToggleButton
          isActive={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          label="Toggle ordered list"
        >
          <ListOrdered className="h-4 w-4" />
        </ToggleButton>
      </div>
      <EditorContent editor={editor} className="p-0" />
    </div>
  )
}

export { Editor }
