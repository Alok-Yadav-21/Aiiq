/**
 * Minimal inline-markdown renderer.
 *
 * The model emits **bold** markers in prose. Without this they leak into the
 * page as literal asterisks. Deliberately tiny — bold only, no raw HTML, so
 * model output can never inject markup.
 */
export function RichText({ children }: { children: string }) {
  const parts = children.split(/(\*\*[^*]+\*\*)/g)
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith('**') && part.endsWith('**') ? (
          <strong key={i} className="font-semibold text-ink">
            {part.slice(2, -2)}
          </strong>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  )
}
