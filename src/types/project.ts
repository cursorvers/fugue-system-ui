export interface Project {
  readonly id: string;
  readonly name: string;
  readonly path?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface Conversation {
  readonly id: string;
  readonly projectId: string;
  readonly title: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly lastMessageAt: string;
}
