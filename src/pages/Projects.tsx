import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  FolderKanban,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useStore } from "@/store/useStore";
import type { Project } from "@/store/useStore";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";

const projectSchema = z.object({
  name: z
    .string()
    .min(1, "Project name is required")
    .max(50, "Name must be less than 50 characters"),
  description: z
    .string()
    .max(200, "Description must be less than 200 characters"),
  color: z.string(),
});

type ProjectForm = z.infer<typeof projectSchema>;

const colors = [
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#14b8a6",
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function Projects() {
  const { projects, tasks, addProject, updateProject, deleteProject } =
    useStore();
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deleteConfirmProject, setDeleteConfirmProject] =
    useState<Project | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProjectForm>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: "",
      description: "",
      color: colors[0],
    },
  });

  const selectedColor = watch("color");

  const filteredProjects = useMemo(() => {
    if (!search) return projects;
    const searchLower = search.toLowerCase();
    return projects.filter(
      (p) =>
        p.name.toLowerCase().includes(searchLower) ||
        p.description.toLowerCase().includes(searchLower)
    );
  }, [projects, search]);

  const openModal = (project?: Project) => {
    if (project) {
      setEditingProject(project);
      setValue("name", project.name);
      setValue("description", project.description);
      setValue("color", project.color);
    } else {
      setEditingProject(null);
      reset({ name: "", description: "", color: colors[0] });
    }
    setIsModalOpen(true);
  };

  const onSubmit = (data: ProjectForm) => {
    if (editingProject) {
      updateProject(editingProject.id, data);
      toast({
        title: "Project updated",
        description: "Your project has been updated successfully.",
      });
    } else {
      addProject({
        name: data.name,
        description: data.description,
        color: data.color,
      });
      toast({
        title: "Project created",
        description: "Your new project has been created.",
      });
    }
    setIsModalOpen(false);
    reset();
  };

  const handleDelete = () => {
    if (deleteConfirmProject) {
      deleteProject(deleteConfirmProject.id);
      toast({
        title: "Project deleted",
        description: "The project and its tasks have been deleted.",
      });
      setDeleteConfirmProject(null);
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-foreground">Projects</h1>
          <p className="text-muted-foreground mt-1">
            Manage and organize your projects
          </p>
        </div>
        <Button variant="gradient" onClick={() => openModal()}>
          <Plus className="h-5 w-5" />
          New Project
        </Button>
      </motion.div>

      {/* Search */}
      <motion.div variants={itemVariants} className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search projects..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </motion.div>

      {/* Projects Grid */}
      {filteredProjects.length > 0 ? (
        <motion.div
          variants={containerVariants}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          <AnimatePresence>
            {filteredProjects.map((project) => {
              const projectTasks = tasks.filter(
                (t) => t.projectId === project.id
              );
              const completedCount = projectTasks.filter(
                (t) => t.status === "completed"
              ).length;
              const progress =
                projectTasks.length > 0
                  ? Math.round((completedCount / projectTasks.length) * 100)
                  : 0;

              return (
                <motion.div
                  key={project.id}
                  variants={itemVariants}
                  layout
                  exit={{ opacity: 0, scale: 0.9 }}
                >
                  <Card className="group h-full hover:shadow-custom-lg transition-all">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-4">
                        <Link
                          to={`/projects/${project.id}`}
                          className="flex items-center gap-3 min-w-0 flex-1"
                        >
                          <div
                            className="h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: project.color + "20" }}
                          >
                            <FolderKanban
                              className="h-6 w-6"
                              style={{ color: project.color }}
                            />
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-semibold text-foreground truncate">
                              {project.name}
                            </h3>
                            <p className="text-xs text-muted-foreground">
                              Created{" "}
                              {format(
                                new Date(project.createdAt),
                                "MMM d, yyyy"
                              )}
                            </p>
                          </div>
                        </Link>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => openModal(project)}
                            >
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setDeleteConfirmProject(project)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {project.description && (
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                          {project.description}
                        </p>
                      )}

                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            {projectTasks.length} tasks
                          </span>
                          <span className="font-medium">
                            {progress}% complete
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-secondary overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${progress}%`,
                              backgroundColor: project.color,
                            }}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      ) : (
        <motion.div variants={itemVariants} className="text-center py-16">
          <FolderKanban className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            {search ? "No projects found" : "No projects yet"}
          </h3>
          <p className="text-muted-foreground mb-6">
            {search
              ? "Try adjusting your search terms"
              : "Create your first project to get started"}
          </p>
          {!search && (
            <Button variant="gradient" onClick={() => openModal()}>
              <Plus className="h-5 w-5" />
              Create Project
            </Button>
          )}
        </motion.div>
      )}

      {/* Create/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingProject ? "Edit Project" : "Create New Project"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name">Project Name</Label>
              <Input
                id="name"
                placeholder="Enter project name"
                {...register("name")}
              />
              {errors.name && (
                <p className="text-sm text-destructive">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                placeholder="Describe your project"
                rows={3}
                {...register("description")}
              />
              {errors.description && (
                <p className="text-sm text-destructive">
                  {errors.description.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2 flex-wrap">
                {colors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setValue("color", color)}
                    className={`h-8 w-8 rounded-lg transition-all ${
                      selectedColor === color
                        ? "ring-2 ring-offset-2 ring-primary scale-110"
                        : "hover:scale-110"
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="gradient" className="flex-1">
                {editingProject ? "Save Changes" : "Create Project"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteConfirmProject}
        onOpenChange={() => setDeleteConfirmProject(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{deleteConfirmProject?.name}" and
              all its tasks. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
