import { PaginationInfo } from "./Pagination";

export interface ListMessageTemplateParams {
  page: number;
  limit: number;
  user_id?: string;
  name?: string;
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
