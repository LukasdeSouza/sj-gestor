import { PaginationInfo } from "@/types/api";

export interface MessageTemplate {
  id: string;
  name: string;
  content: string;
  user_id: string | null;
  is_default: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMessageTemplateData {
  name: string;
  content: string;
  user_id?: string;
}

export interface MessageTemplatesResponse extends PaginationInfo {
  templates: MessageTemplate[];
}