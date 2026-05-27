// Graph data is serialised into problem_text as a suffix marker so the same
// SVG can re-render days later from the persisted DB row, without a schema
// change. parseGraphPrompt is called by WorksheetForm and the results review
// page; both render the plain prompt above plus the SVG below.

export type GraphSpec =
  | { kind: 'point'; x: number; y: number; label?: string }
  | { kind: 'line'; slope: number; intercept: number; highlightX?: number }

export interface ParsedGraphPrompt {
  displayText: string
  graph?: GraphSpec
  choices?: GraphSpec[]
}

const GRAPH_OPEN = '[GRAPH]'
const GRAPH_CLOSE = '[/GRAPH]'
const CHOICES_OPEN = '[CHOICES]'
const CHOICES_CLOSE = '[/CHOICES]'

function isGraphSpec(v: unknown): v is GraphSpec {
  if (!v || typeof v !== 'object') return false
  const o = v as Record<string, unknown>
  if (o.kind === 'point') {
    return typeof o.x === 'number' && typeof o.y === 'number'
  }
  if (o.kind === 'line') {
    return typeof o.slope === 'number' && typeof o.intercept === 'number'
  }
  return false
}

function extractBlock(text: string, open: string, close: string): { before: string; payload: string } | null {
  const openIdx = text.indexOf(open)
  if (openIdx === -1) return null
  const closeIdx = text.indexOf(close, openIdx + open.length)
  if (closeIdx === -1) return null
  const before = text.slice(0, openIdx).trimEnd()
  const payload = text.slice(openIdx + open.length, closeIdx)
  return { before, payload }
}

export function parseGraphPrompt(text: string): ParsedGraphPrompt {
  const choicesBlock = extractBlock(text, CHOICES_OPEN, CHOICES_CLOSE)
  if (choicesBlock) {
    try {
      const parsed = JSON.parse(choicesBlock.payload)
      if (Array.isArray(parsed) && parsed.length === 4 && parsed.every(isGraphSpec)) {
        return { displayText: choicesBlock.before, choices: parsed as GraphSpec[] }
      }
    } catch {
      // fall through to plain-text return
    }
  }

  const graphBlock = extractBlock(text, GRAPH_OPEN, GRAPH_CLOSE)
  if (graphBlock) {
    try {
      const parsed = JSON.parse(graphBlock.payload)
      if (isGraphSpec(parsed)) {
        return { displayText: graphBlock.before, graph: parsed }
      }
    } catch {
      // fall through
    }
  }

  return { displayText: text }
}

export function encodeGraphPrompt(displayText: string, graph: GraphSpec): string {
  return `${displayText}\n${GRAPH_OPEN}${JSON.stringify(graph)}${GRAPH_CLOSE}`
}

export function encodeChoicesPrompt(displayText: string, choices: GraphSpec[]): string {
  return `${displayText}\n${CHOICES_OPEN}${JSON.stringify(choices)}${CHOICES_CLOSE}`
}
