import { PaginationInfo } from "@/types/api";

export interface MessageTemplate {
  id: string;
  user_id: string;
  content: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface CreateMessageTemplateData {
  name: string;
  content: string;
  user_id: string;
}

export interface MessageTemplate extends CreateMessageTemplateData {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MessageTemplatesResponse extends PaginationInfo {
  templates: MessageTemplate[];
}