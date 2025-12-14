// src/constants/index.js
// --- PHASE 19.1: CENTRALIZED CONSTANTS ---

// 1. FIRESTORE COLLECTION NAMES
export const COLLECTIONS = {
    USERS: 'users',
    DOUBTS: 'doubts',
    PAPERS: 'papers',
    TEAMS: 'teams',
    MESSAGES: 'messages',
    PAPER_MESSAGES: 'paperMessages',
    CONVERSATIONS: 'conversations',
    SUPPORT_CONVERSATIONS: 'supportConversations',
    RATINGS: 'ratings',
    WARNINGS: 'warnings',
    SETTINGS: 'settings',
    POLLS: 'polls',
    // Sub-collections:
    TOPICS_SUB: 'topics', 
    FAQS_SUB: 'faqs',
    MESSAGES_SUB: 'messages',
};

// 2. USER ROLES
export const USER_ROLES = {
    STUDENT: 'student',
    FACULTY: 'faculty',
    ADMIN: 'admin',
    SUPER_ADMIN: 'superadmin',
    TECHNICAL_SUPPORT: 'technical_support',
    COORDINATOR: 'coordinator',
};

// 3. CHAT/DOUBT RELATED CONSTANTS
export const CHAT_TYPES = {
    DOUBT: 'doubt',
    GROUP: 'group',
    DM: 'dm',
    SUPPORT: 'support',
};

export const MESSAGE_TYPES = {
    TEXT: 'text',
    IMAGE: 'image',
    AUDIO: 'audio',
    FILE: 'file',
    VIDEO: 'video',
    POLL: 'poll',
    SYSTEM: 'system',
};

export const DOUBT_STATUS = {
    UNASSIGNED: 'unassigned',
    ASSIGNED: 'assigned',
    RESOLVED: 'resolved',
};

// 4. DEFAULT VALUES
export const DEFAULT_AVATAR_URL = 'https://example.com/default-avatar.png'; // Placeholder URL
export const DEFAULT_GROUP_TOPIC = 'general';
export const MIN_POLL_OPTIONS = 2;