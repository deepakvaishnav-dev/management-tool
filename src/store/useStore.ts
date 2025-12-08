import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  dueDate: string;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  color: string;
  createdAt: string;
}

interface AppState {
  user: User | null;
  projects: Project[];
  tasks: Task[];
  theme: 'light' | 'dark';
  
  // Auth actions
  login: (email: string, password: string) => boolean;
  register: (name: string, email: string, password: string) => boolean;
  logout: () => void;
  
  // Project actions
  addProject: (project: Omit<Project, 'id' | 'createdAt'>) => void;
  updateProject: (id: string, project: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  
  // Task actions
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  updateTask: (id: string, task: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  
  // Theme actions
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: null,
      projects: [],
      tasks: [],
      theme: 'light',
      
      login: (email, password) => {
        const storedUsers = JSON.parse(localStorage.getItem('promanage-users') || '[]');
        const user = storedUsers.find((u: { email: string; password: string; name: string; id?: string }) => u.email === email && u.password === password);
        if (user) {
          set({ user: { id: user.id || generateId(), name: user.name, email: user.email } });
          return true;
        }
        return false;
      },
      
      register: (name, email, password) => {
        const storedUsers = JSON.parse(localStorage.getItem('promanage-users') || '[]');
        if (storedUsers.find((u: { email: string }) => u.email === email)) {
          return false;
        }
        const newUser = { id: generateId(), name, email, password };
        storedUsers.push(newUser);
        localStorage.setItem('promanage-users', JSON.stringify(storedUsers));
        set({ user: { id: newUser.id, name, email } });
        return true;
      },
      
      logout: () => set({ user: null }),
      
      addProject: (project) => set((state) => ({
        projects: [...state.projects, { ...project, id: generateId(), createdAt: new Date().toISOString() }]
      })),
      
      updateProject: (id, project) => set((state) => ({
        projects: state.projects.map((p) => p.id === id ? { ...p, ...project } : p)
      })),
      
      deleteProject: (id) => set((state) => ({
        projects: state.projects.filter((p) => p.id !== id),
        tasks: state.tasks.filter((t) => t.projectId !== id)
      })),
      
      addTask: (task) => set((state) => ({
        tasks: [...state.tasks, { ...task, id: generateId(), createdAt: new Date().toISOString() }]
      })),
      
      updateTask: (id, task) => set((state) => ({
        tasks: state.tasks.map((t) => t.id === id ? { ...t, ...task } : t)
      })),
      
      deleteTask: (id) => set((state) => ({
        tasks: state.tasks.filter((t) => t.id !== id)
      })),
      
      toggleTheme: () => set((state) => {
        const newTheme = state.theme === 'light' ? 'dark' : 'light';
        document.documentElement.classList.toggle('dark', newTheme === 'dark');
        return { theme: newTheme };
      }),
      
      setTheme: (theme) => {
        document.documentElement.classList.toggle('dark', theme === 'dark');
        set({ theme });
      },
    }),
    {
      name: 'promanage-storage',
      onRehydrateStorage: () => (state) => {
        if (state?.theme === 'dark') {
          document.documentElement.classList.add('dark');
        }
      },
    }
  )
);
