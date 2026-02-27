export interface HTMLItem {
  slug: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  size: number;
  filePath: string;
}

export interface Frontmatter {
  title?: string;
  description?: string;
  category?: string;
  tags?: string[];
  date?: string;
  author?: string;
}
