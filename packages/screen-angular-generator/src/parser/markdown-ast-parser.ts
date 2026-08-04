import type { Code, Heading, Nodes, Parent, Root, Table } from 'mdast';
import { toString } from 'mdast-util-to-string';

import { normalizeText, stripHeadingNumber } from '../utilities/markdown-text.js';

export interface SectionContext {
  depth: number;
  rawHeading: string;
  heading: string;
  lineStart: number;
  path: string[];
}

export interface LocatedNode {
  node: Nodes;
  lineStart: number;
  lineEnd: number;
  section: SectionContext;
  precedingParagraph: string | null;
}

export interface ParsedMarkdownStructure {
  title: string;
  sections: SectionContext[];
  nodes: LocatedNode[];
  tables: LocatedNode[];
  codeBlocks: LocatedNode[];
}

function nodePosition(node: Nodes): { start: number; end: number } {
  const start = node.position?.start.line ?? 1;
  const end = node.position?.end.line ?? start;
  return { start, end };
}

export function parseMarkdownStructure(tree: Root): ParsedMarkdownStructure {
  const sections: SectionContext[] = [];
  const stack: SectionContext[] = [];
  const nodes: LocatedNode[] = [];
  const tables: LocatedNode[] = [];
  const codeBlocks: LocatedNode[] = [];
  let title = 'Untitled';
  let precedingParagraph: string | null = null;

  const rootChildren = (tree as Parent).children ?? [];

  for (const child of rootChildren) {
    const { start, end } = nodePosition(child);

    if (child.type === 'heading') {
      const heading = child as Heading;
      const rawHeading = normalizeText(toString(heading));
      const cleaned = stripHeadingNumber(rawHeading);

      while (stack.length > 0 && (stack[stack.length - 1]?.depth ?? 0) >= heading.depth) {
        stack.pop();
      }

      const path = [...stack.map((item) => item.heading), cleaned];
      const section: SectionContext = {
        depth: heading.depth,
        rawHeading,
        heading: cleaned,
        lineStart: start,
        path,
      };
      stack.push(section);
      sections.push(section);

      if (heading.depth === 1 && title === 'Untitled') {
        title = cleaned;
      }
      precedingParagraph = null;
      continue;
    }

    const currentSection =
      stack.length > 0
        ? stack[stack.length - 1]!
        : {
            depth: 0,
            rawHeading: '(root)',
            heading: '(root)',
            lineStart: 1,
            path: ['(root)'],
          };

    if (child.type === 'paragraph') {
      precedingParagraph = normalizeText(toString(child));
    }

    const located: LocatedNode = {
      node: child,
      lineStart: start,
      lineEnd: end,
      section: currentSection,
      precedingParagraph,
    };
    nodes.push(located);

    if (child.type === 'table') {
      tables.push({ ...located, node: child as Table });
      precedingParagraph = null;
    } else if (child.type === 'code') {
      codeBlocks.push({ ...located, node: child as Code });
    }
  }

  return { title, sections, nodes, tables, codeBlocks };
}
