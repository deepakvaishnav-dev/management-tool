import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { format, isBefore } from "date-fns";
import {
  Search,
  CheckSquare,
  Calendar,
  Flag,
  FolderKanban,
  MoreHorizontal,
  Trash2,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import type { Task } from "@/store/useStore";
import { toast } from "@/hooks/use-toast";

const priorityColors = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-warning/20 text-warning",
  high: "bg-destructive/20 text-destructive",
};

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

export default function Tasks() {
  const { projects, tasks, updateTask, deleteTask } = useStore();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [deleteConfirmTask, setDeleteConfirmTask] = useState<Task | null>(null);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesSearch =
        !search ||
        task.title.toLowerCase().includes(search.toLowerCase()) ||
        task.description.toLowerCase().includes(search.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || task.status === statusFilter;
      const matchesPriority =
        priorityFilter === "all" || task.priority === priorityFilter;
      const matchesProject =
        projectFilter === "all" || task.projectId === projectFilter;
      return (
        matchesSearch && matchesStatus && matchesPriority && matchesProject
      );
    });
  }, [tasks, search, statusFilter, priorityFilter, projectFilter]);

  const groupedByStatus = useMemo(() => {
    const groups = {
      todo: [] as Task[],
      "in-progress": [] as Task[],
      completed: [] as Task[],
    };
    filteredTasks.forEach((task) => {
      groups[task.status].push(task);
    });
    return groups;
  }, [filteredTasks]);

  const handleStatusChange = (taskId: string, status: Task["status"]) => {
    updateTask(taskId, { status });
    toast({ title: "Status updated" });
  };

  const handleDelete = () => {
    if (deleteConfirmTask) {
      deleteTask(deleteConfirmTask.id);
      toast({
        title: "Task deleted",
        description: "The task has been removed.",
      });
      setDeleteConfirmTask(null);
    }
  };

  const getProjectById = (projectId: string) =>
    projects.find((p) => p.id === projectId);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <h1 className="text-3xl font-bold text-foreground backdrop-blur-lg">All Tasks</h1>
        <p className="text-muted-foreground mt-1">
          View and manage all tasks across your projects
        </p>
      </motion.div>

      {/* Filters */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col lg:flex-row gap-4"
      >
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={projectFilter} onValueChange={setProjectFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Project" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="todo">To Do</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      {/* Kanban View */}
      {filteredTasks.length > 0 ? (
        <motion.div
          variants={itemVariants}
          className="grid gap-6 lg:grid-cols-3"
        >
          {(["todo", "in-progress", "completed"] as const).map((status) => (
            <Card key={status} className="h-fit">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-base">
                  <span className="flex items-center gap-2">
                    {status === "todo" && (
                      <div className="h-3 w-3 rounded-full bg-muted-foreground" />
                    )}
                    {status === "in-progress" && (
                      <div className="h-3 w-3 rounded-full bg-accent" />
                    )}
                    {status === "completed" && (
                      <div className="h-3 w-3 rounded-full bg-success" />
                    )}
                    {status === "todo" && "To Do"}
                    {status === "in-progress" && "In Progress"}
                    {status === "completed" && "Completed"}
                  </span>
                  <Badge variant="secondary" className="font-normal">
                    {groupedByStatus[status].length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <AnimatePresence>
                  {groupedByStatus[status].map((task) => {
                    const project = getProjectById(task.projectId);
                    const isOverdue =
                      task.status !== "completed" &&
                      isBefore(new Date(task.dueDate), new Date());

                    return (
                      <motion.div
                        key={task.id}
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="group"
                      >
                        <Card className="bg-secondary/50 hover:bg-secondary transition-colors">
                          <CardContent className="p-3">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <h4
                                className={`text-sm font-medium ${
                                  task.status === "completed"
                                    ? "line-through text-muted-foreground"
                                    : "text-foreground"
                                }`}
                              >
                                {task.title}
                              </h4>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                                  >
                                    <MoreHorizontal className="h-3 w-3" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  {status !== "todo" && (
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleStatusChange(task.id, "todo")
                                      }
                                    >
                                      Move to To Do
                                    </DropdownMenuItem>
                                  )}
                                  {status !== "in-progress" && (
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleStatusChange(
                                          task.id,
                                          "in-progress"
                                        )
                                      }
                                    >
                                      Move to In Progress
                                    </DropdownMenuItem>
                                  )}
                                  {status !== "completed" && (
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleStatusChange(task.id, "completed")
                                      }
                                    >
                                      Mark Complete
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem
                                    onClick={() => setDeleteConfirmTask(task)}
                                    className="text-destructive focus:text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>

                            {task.description && (
                              <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                                {task.description}
                              </p>
                            )}

                            <div className="flex flex-wrap items-center gap-1.5">
                              <Badge
                                variant="secondary"
                                className={`${
                                  priorityColors[task.priority]
                                } text-[10px] px-1.5 py-0`}
                              >
                                <Flag className="h-2.5 w-2.5 mr-0.5" />
                                {task.priority}
                              </Badge>

                              <span
                                className={`text-[10px] flex items-center gap-0.5 ${
                                  isOverdue
                                    ? "text-destructive"
                                    : "text-muted-foreground"
                                }`}
                              >
                                {isOverdue && (
                                  <AlertCircle className="h-2.5 w-2.5" />
                                )}
                                <Calendar className="h-2.5 w-2.5" />
                                {format(new Date(task.dueDate), "MMM d")}
                              </span>
                            </div>

                            {project && (
                              <Link
                                to={`/projects/${project.id}`}
                                className="mt-2 block"
                              >
                                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors">
                                  <div
                                    className="h-2 w-2 rounded-full"
                                    style={{ backgroundColor: project.color }}
                                  />
                                  {project.name}
                                </div>
                              </Link>
                            )}
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                {groupedByStatus[status].length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    No tasks
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </motion.div>
      ) : (
        <motion.div variants={itemVariants} className="text-center py-16">
          <CheckSquare className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            {search ||
            statusFilter !== "all" ||
            priorityFilter !== "all" ||
            projectFilter !== "all"
              ? "No tasks found"
              : "No tasks yet"}
          </h3>
          <p className="text-muted-foreground mb-6">
            {search ||
            statusFilter !== "all" ||
            priorityFilter !== "all" ||
            projectFilter !== "all"
              ? "Try adjusting your filters"
              : "Create a project first, then add tasks to it"}
          </p>
          {!search &&
            statusFilter === "all" &&
            priorityFilter === "all" &&
            projectFilter === "all" && (
              <Link to="/projects">
                <Button variant="gradient">
                  <FolderKanban className="h-5 w-5" />
                  Go to Projects
                </Button>
              </Link>
            )}
        </motion.div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteConfirmTask}
        onOpenChange={() => setDeleteConfirmTask(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{deleteConfirmTask?.title}". This
              action cannot be undone.
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
