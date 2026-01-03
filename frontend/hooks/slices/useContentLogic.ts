
import { useState } from 'react';
import { Doc, Folder, Meeting, ContentPost } from '../../../types';
import { api } from '../../../backend/api';

export const useContentLogic = (showNotification: (msg: string) => void, activeTableId: string) => {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [contentPosts, setContentPosts] = useState<ContentPost[]>([]);
  
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [targetFolderId, setTargetFolderId] = useState<string | undefined>(undefined);
  const [activeDocId, setActiveDocId] = useState<string>('');
  const [editingDoc, setEditingDoc] = useState<Doc | null>(null);

  // Meetings
  const saveMeeting = (m: Meeting) => { 
      const existing = meetings.find(meeting => meeting.id === m.id);
      const u = existing 
          ? meetings.map(meeting => meeting.id === m.id ? m : meeting)
          : [...meetings, m]; 
      setMeetings(u); 
      api.meetings.updateAll(u); 
      showNotification(existing ? 'Встреча обновлена' : 'Встреча добавлена'); 
  };
  const updateMeetingSummary = (id: string, summary: string) => { const u = meetings.map(m => m.id === id ? { ...m, summary } : m); setMeetings(u); api.meetings.updateAll(u); };

  // Content Plan
  const savePost = (p: ContentPost) => {
      const updated = contentPosts.find(x => x.id === p.id) ? contentPosts.map(x => x.id === p.id ? p : x) : [...contentPosts, p];
      setContentPosts(updated); api.contentPosts.updateAll(updated); showNotification('Пост сохранен');
  };
  const deletePost = (id: string) => { const u = contentPosts.filter(p => p.id !== id); setContentPosts(u); api.contentPosts.updateAll(u); showNotification('Пост удален'); };

  // Docs
  const saveDoc = (docData: any, tableId?: string, folderId?: string) => {
      // Для документов не требуется tableId - используем системную таблицу docs или пустую строку
      // tableId используется только для фильтрации при показе, но не обязателен для создания
      const targetTableId = tableId || activeTableId || '';
      // Используем folderId из параметра, если передан, иначе из targetFolderId
      const finalFolderId = folderId !== undefined ? folderId : targetFolderId;
      
      if (!docData || !docData.title || !docData.title.trim()) {
          showNotification('Введите название документа');
          return;
      }
      
      // Если есть id, значит это редактирование
      if (docData.id) {
          const existingDoc = docs.find(d => d.id === docData.id);
          if (existingDoc) {
              const updatedDoc: Doc = {
                  ...existingDoc,
                  title: docData.title.trim(),
                  url: docData.url,
                  tags: docData.tags || [],
                  type: docData.type || existingDoc.type,
                  folderId: finalFolderId
              };
              const updatedDocs = docs.map(d => d.id === docData.id ? updatedDoc : d);
              setDocs(updatedDocs);
              api.docs.updateAll(updatedDocs);
              setIsDocModalOpen(false);
              setTargetFolderId(undefined);
              showNotification('Документ обновлен');
              return updatedDoc;
          }
      }
      
      // Создание нового документа
      const newDoc: Doc = { 
          id: `d-${Date.now()}`, 
          tableId: targetTableId, 
          folderId: finalFolderId,
          title: docData.title.trim(), 
          url: docData.url, 
          content: '', 
          tags: docData.tags || [], 
          type: docData.type || 'link'
      };
      const newDocs = [...docs, newDoc]; 
      setDocs(newDocs); 
      api.docs.updateAll(newDocs); 
      setIsDocModalOpen(false);
      setTargetFolderId(undefined); // Сброс после создания
      showNotification('Документ добавлен');
      return newDoc;
  };
  const saveDocContent = (id: string, content: string, title: string) => { const u = docs.map(d => d.id === id ? { ...d, content, title } : d); setDocs(u); api.docs.updateAll(u); showNotification('Сохранено'); };
  const deleteDoc = (id: string) => { const u = docs.filter(d => d.id !== id); setDocs(u); api.docs.updateAll(u); showNotification('Документ удален'); };

  // Folders
  const createFolder = (name: string, tableId?: string, parentFolderId?: string) => {
      // Для папок не требуется tableId - используем системную таблицу docs или пустую строку
      const targetTableId = tableId || activeTableId || '';
      
      if (!name || !name.trim()) {
          showNotification('Введите название папки');
          return;
      }
      const newFolder: Folder = { 
          id: `f-${Date.now()}`, 
          tableId: targetTableId, 
          name: name.trim(),
          parentFolderId: parentFolderId
      };
      const u = [...folders, newFolder]; 
      setFolders(u); 
      api.folders.updateAll(u); 
      showNotification('Папка создана');
  };
  const deleteFolder = (id: string) => { 
      const u = folders.filter(f => f.id !== id); 
      setFolders(u); 
      api.folders.updateAll(u); 
      showNotification('Папка удалена'); 
  };

  const handleDocClick = (doc: Doc) => {
      if (doc.type === 'link' && doc.url) window.open(doc.url, '_blank');
      else { setActiveDocId(doc.id); return 'doc-editor'; }
      return null;
  };

  return {
    state: { docs, folders, meetings, contentPosts, isDocModalOpen, activeDocId, targetFolderId, editingDoc },
    setters: { setDocs, setFolders, setMeetings, setContentPosts, setActiveDocId },
    actions: { 
        saveMeeting, updateMeetingSummary, savePost, deletePost,
        saveDoc, saveDocContent, deleteDoc, createFolder, deleteFolder, handleDocClick,
        openDocModal: (folderId?: string) => { setTargetFolderId(folderId); setEditingDoc(null); setIsDocModalOpen(true); },
        openEditDocModal: (doc: Doc) => { setEditingDoc(doc); setTargetFolderId(doc.folderId); setIsDocModalOpen(true); },
        closeDocModal: () => { setIsDocModalOpen(false); setTargetFolderId(undefined); setEditingDoc(null); }
    }
  };
};
