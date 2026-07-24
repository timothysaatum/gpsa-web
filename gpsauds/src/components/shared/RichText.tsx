import { useEffect, useRef } from 'react'
import {
  Bold, Heading2, Italic, Link as LinkIcon, List, ListOrdered, Quote, Redo2, RemoveFormatting, Undo2,
} from 'lucide-react'
import { cn } from '@/utils'

const allowedTags = new Set(['A', 'BLOCKQUOTE', 'BR', 'EM', 'H2', 'H3', 'LI', 'OL', 'P', 'STRONG', 'U', 'UL'])

export function sanitizeRichText(value: string) {
  if (typeof window === 'undefined' || !value.includes('<')) return value
  const documentNode = new DOMParser().parseFromString(value, 'text/html')
  documentNode.body.querySelectorAll('*').forEach((element) => {
    if (!allowedTags.has(element.tagName)) {
      element.replaceWith(...Array.from(element.childNodes))
      return
    }
    Array.from(element.attributes).forEach((attribute) => {
      if (element.tagName !== 'A' || !['href', 'target', 'rel'].includes(attribute.name)) {
        element.removeAttribute(attribute.name)
      }
    })
    if (element.tagName === 'A') {
      const href = element.getAttribute('href') ?? ''
      if (!/^(https?:|mailto:|tel:|\/|#)/i.test(href)) element.removeAttribute('href')
      element.setAttribute('rel', 'noopener noreferrer')
    }
  })
  return documentNode.body.innerHTML
}

const richTextStyles = [
  'text-secondary leading-7',
  '[&_p]:mb-3 [&_p:last-child]:mb-0',
  '[&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-deep [&_h2]:mb-3',
  '[&_h3]:font-display [&_h3]:text-xl [&_h3]:font-bold [&_h3]:text-deep [&_h3]:mb-2',
  '[&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-6 [&_ol]:pl-6 [&_li]:mb-1',
  '[&_blockquote]:border-l-4 [&_blockquote]:border-gold-400 [&_blockquote]:pl-4 [&_blockquote]:italic',
  '[&_a]:font-700 [&_a]:text-green-700 [&_a]:underline',
].join(' ')

export function RichTextContent({ value, className }: { value: string; className?: string }) {
  if (!value.includes('<')) return <div className={cn(richTextStyles, 'whitespace-pre-wrap', className)}>{value}</div>
  return <div className={cn(richTextStyles, className)} dangerouslySetInnerHTML={{ __html: sanitizeRichText(value) }} />
}

export function RichTextEditor({
  label,
  value,
  onChange,
  required,
  minHeight = '10rem',
}: {
  label: string
  value: string
  onChange: (value: string) => void
  required?: boolean
  minHeight?: string
}) {
  const editor = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (editor.current && editor.current.innerHTML !== value) editor.current.innerHTML = sanitizeRichText(value)
  }, [value])

  const run = (command: string, argument?: string) => {
    editor.current?.focus()
    document.execCommand(command, false, argument)
    onChange(sanitizeRichText(editor.current?.innerHTML ?? ''))
  }
  const link = () => {
    const url = window.prompt('Enter a link URL')
    if (url) run('createLink', url)
  }
  const tools = [
    { title: 'Bold', icon: Bold, action: () => run('bold') },
    { title: 'Italic', icon: Italic, action: () => run('italic') },
    { title: 'Heading', icon: Heading2, action: () => run('formatBlock', 'h2') },
    { title: 'Bulleted list', icon: List, action: () => run('insertUnorderedList') },
    { title: 'Numbered list', icon: ListOrdered, action: () => run('insertOrderedList') },
    { title: 'Quote', icon: Quote, action: () => run('formatBlock', 'blockquote') },
    { title: 'Link', icon: LinkIcon, action: link },
    { title: 'Clear formatting', icon: RemoveFormatting, action: () => run('removeFormat') },
    { title: 'Undo', icon: Undo2, action: () => run('undo') },
    { title: 'Redo', icon: Redo2, action: () => run('redo') },
  ]
  return (
    <label className="block md:col-span-2">
      <span className="form-label">{label}</span>
      <div className="overflow-hidden rounded-xl border border-cream-dark bg-white focus-within:border-green-600 focus-within:ring-2 focus-within:ring-green-100">
        <div className="flex flex-wrap gap-1 border-b border-cream-dark bg-cream/60 p-2">
          {tools.map(({ title, icon: Icon, action }) => (
            <button key={title} type="button" title={title} aria-label={title} className="rounded-md p-2 text-deep hover:bg-white hover:text-green-700" onMouseDown={(event) => event.preventDefault()} onClick={action}>
              <Icon className="h-4 w-4" />
            </button>
          ))}
        </div>
        <div
          ref={editor}
          role="textbox"
          aria-label={label}
          aria-multiline="true"
          contentEditable
          suppressContentEditableWarning
          className={cn(richTextStyles, 'form-input rounded-none border-0 focus:ring-0')}
          style={{ minHeight }}
          onInput={(event) => onChange(sanitizeRichText(event.currentTarget.innerHTML))}
          onBlur={(event) => onChange(sanitizeRichText(event.currentTarget.innerHTML))}
        />
        {required && !value.replace(/<[^>]*>/g, '').trim() && <input className="sr-only" value="" onChange={() => undefined} required />}
      </div>
    </label>
  )
}
