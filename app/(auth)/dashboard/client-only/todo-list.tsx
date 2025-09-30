import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import {
  AddTodoForm,
  TodoListContainer,
  TodoCompleteButton,
  TodoEmptyState,
  TodoItem,
  TodoList as TodoListComponent,
  TodoRemoveButton,
  TodoText,
} from "@/components/server";

export const TodoList = () => {
  // const todos = useQuery(api.v1.chat.getThreadList);

  return <TodoListContainer></TodoListContainer>;
};
