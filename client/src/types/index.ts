export interface Chatbot {
  id: string;
  name: string;
  subject: string;
  description: string;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
}

export interface UserGroup {
  id: string;
  name: string;
  description: string;
  created_by: string | null;
  created_at: string;
}

export interface UserGroupMember {
  id: string;
  group_id: string;
  user_id: string;
  added_at: string;
}

export interface ChatbotPermission {
  id: string;
  chatbot_id: string;
  user_id: string | null;
  group_id: string | null;
  permission_type: string;
  granted_by: string | null;
  granted_at: string;
}

export interface UserProfile {
  id: string;
  email: string;
  display_name: string;
  is_admin: boolean;
  created_at: string;
}
