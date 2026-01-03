
import { storageService } from "../../services/storageService";
import { Doc, Folder, Meeting, ContentPost } from "../../types";

export const docsEndpoint = {
  getAll: () => storageService.getDocs(),
  updateAll: (docs: Doc[]) => storageService.setDocs(docs),
};

export const foldersEndpoint = {
  getAll: () => storageService.getFolders(),
  updateAll: (folders: Folder[]) => storageService.setFolders(folders),
};

export const meetingsEndpoint = {
  getAll: () => storageService.getMeetings(),
  updateAll: (meetings: Meeting[]) => storageService.setMeetings(meetings),
};

export const contentPostsEndpoint = {
  getAll: () => storageService.getContentPosts(),
  updateAll: (posts: ContentPost[]) => storageService.setContentPosts(posts),
};
