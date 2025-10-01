import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAction, useMutation } from "convex/react";
import type { OptionalRestArgsOrSkip, PaginatedQueryArgs, PaginatedQueryReference, UsePaginatedQueryReturnType } from "convex/react";
import { getFunctionName } from "convex/server";
import type { FunctionArgs, FunctionReference, FunctionReturnType } from "convex/server";
import { ConvexQueryCacheContext } from "convex-helpers/react/cache/provider";
import { useQueries, useQuery } from "convex-helpers/react/cache/hooks";
import type { ClientApi } from "@convex-dev/r2";
import { api, api as convexApi } from "@/convex/_generated/api";
import { fetchWithUploadProgress, type OnUploadProgressCallback } from "./fetch";

export const useConvexMutation = <
  Mutation extends FunctionReference<"mutation">,
>(
  mutationFunction: Mutation
) => {
  const [isPending, setIsPending] = useState(false);
  const mutation = useMutation(mutationFunction);

  const mutate = useCallback(
    async (
      values: FunctionArgs<Mutation>,
      options?: {
        onSuccess?: (res: FunctionReturnType<Mutation>) => void;
        onError?: (error: { data: string }) => void;
        onSettled?: () => void;
        throwError?: boolean;
      }
    ): Promise<FunctionReturnType<Mutation> | undefined> => {
      try {
        setIsPending(true);
        const response = await mutation(values);
        options?.onSuccess?.(response);
        return response;
      } catch (error) {
        options?.onError?.(error as { data: string });
        if (options?.throwError) {
          throw error;
        }
      } finally {
        setIsPending(false);
        options?.onSettled?.();
      }
    },
    [mutation]
  );

  return { mutate, isPending };
};

export const useConvexAction = <
  Action extends FunctionReference<"action">,
>(
  actionFunction: Action
) => {
  const [isPending, setIsPending] = useState(false);
  const action = useAction(actionFunction);

  const runAction = useCallback(
    async (
      values: FunctionArgs<Action>,
      options?: {
        onSuccess?: (res: FunctionReturnType<Action>) => void;
        onError?: (error: { data: string }) => void;
        onSettled?: () => void;
        throwError?: boolean;
      }
    ): Promise<FunctionReturnType<Action> | undefined> => {
      try {
        setIsPending(true);
        const response = await action(values);
        options?.onSuccess?.(response);
        return response;
      } catch (error) {
        options?.onError?.(error as { data: string });
        if (options?.throwError) {
          throw error;
        }
      } finally {
        setIsPending(false);
        options?.onSettled?.();
      }
    },
    [action]
  );

  return { runAction, isPending };
};

export type PaginatedQueryState<T> = {
  results: T[];
  status: "LoadingFirstPage" | "CanLoadMore" | "LoadingMore" | "Exhausted";
  loadMore: (numItems: number) => void;
  isLoading: boolean;
};

export function usePaginateCacheQuery<Query extends PaginatedQueryReference>(
  query: Query,
  args: PaginatedQueryArgs<Query> | "skip",
  options: { initialNumItems: number }
) {
  type Type = UsePaginatedQueryReturnType<Query>
  const [isContexted, setIsContexted] = useState(false);
  const [status, setStatus] = useState<'LoadingFirstPage' | 'LoadingMore' | 'Exhausted'>("LoadingFirstPage");
  const [isLoading, setIsLoading] = useState(true);
  const [paginateData, setPaginateData] = useState<Type['results']>([]);
  const [cursorKey, setCursorKey] = useState([
    { numItems: options.initialNumItems, cursor: null, id: 1 },
  ]);

  const context = useContext(ConvexQueryCacheContext);
  const queriesData = useMemo(() => {
    const queries: any = {};
    if (args === "skip") {
      return queries;
    } else {
      cursorKey.forEach((cursor) => {
        queries[cursor?.cursor || "first"] = {
          query,
          args: { ...args, paginationOpts: cursor },
        };
      });
      return queries;
    }
  }, [cursorKey, args, query]);

  let paginateId = cursorKey.length;

  const nextPaginate = () => {
    paginateId++;
    return paginateId;
  };

  const paginated = useQueries(queriesData);

  const loadMore = (numItems: number) => {
    if (isLoading) return;
    if (status === "Exhausted") {
      setStatus("Exhausted");
      return;
    };
    const lastKey = Object.keys(paginated)[
      Object.keys(paginated).length - 1
    ] as string;
    const lastPaginated = paginated[lastKey];
    if (!lastPaginated?.continueCursor && !lastPaginated?.isDone) return;
    setCursorKey((prev) => [
      ...prev,
      {
        numItems: numItems,
        cursor: lastPaginated.continueCursor,
        id: nextPaginate(),
      },
    ]);
  };

  useEffect(() => {
    const allKeys = Object.keys(paginated);
    const latestKeys = allKeys[allKeys.length - 1] as string;
    const latestPage = paginated[latestKeys];
    let totalPaginate: any = [];

    for (const key in paginated) {
      const currentPage = paginated[key];
      if (!currentPage) break;
      totalPaginate = [...totalPaginate, ...(currentPage?.page || [])];
    }

    if (latestPage === undefined) {
      setIsLoading(true);
      if (allKeys.length > 1) {
        setStatus("LoadingMore");
      }
    } else {
      setIsLoading(false);
      if (latestPage.isDone) {
        setStatus("Exhausted");
      }
    }
    setPaginateData(totalPaginate);
  }, [paginated]);

  useEffect(() => {
    if (context.registry && context.registry.queries.size > 0 && !isContexted) {
      const argsKey = Object.keys(args);
      // let key: string | null = null;
      // if (argsKey.length > 0 && argsKey[0] && args !== "skip") {
      //   const ids = argsKey[0] as keyof PaginatedQueryArgs<Query>;
      //   key = args[ids] as string;
      // } else {
      //   key = getFunctionName(query);
      // }

      let key: string = "";
      const keys: string[] = [];
      if (args !== "skip" && argsKey.length > 0) {
        argsKey.forEach((arg) => {
          const argKey = arg as keyof PaginatedQueryArgs<Query>;
          keys.push(args[argKey] as string);
        });
      } else {
        key = getFunctionName(query);
      }

      if (keys.length === 0 && key === "") return;
      const mapData = Array.from(context.registry?.queries.keys());
      let filtereds: string[] = [];
      if (keys.length > 0) {
        mapData.forEach((q) => {
          let isSame = true;
          keys.forEach((key) => {
            if (!q.includes(key)) {
              isSame = false;
            }
          });
          if (isSame) {
            filtereds.push(q);
          } else {
            isSame = true;
          }
        });
      }
      if (filtereds.length === 0 && key !== "") {
        filtereds = mapData.filter((q) => q.includes(key));
      }
      const mappedOptions = filtereds.map(
        (q) => JSON.parse(q)[1].paginationOpts
      );
      if (!mappedOptions || mappedOptions.length === 0) return;
      setCursorKey(mappedOptions);
      setIsContexted(true);
    }
  }, [context]);

  return { paginateData, loadMore, isLoading, status };
}

/**
 * A hook that allows you to upload a file to R2.
 *
 * This hook can be used as is, or copied into your own code for customization
 * and tighter control.
 *
 * @param api - The client API object from the R2 component, including at least
 * `generateUploadUrl` and `syncMetadata`.
 * @returns A function that uploads a file to R2.
 */
export function useConvexUploadFile(
  api: Pick<ClientApi, "generateUploadUrl" | "syncMetadata">,
  hasPrefix?: boolean
) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const generateUploadUrl = useMutation(api.generateUploadUrl);
  const syncMetadata = useMutation(api.syncMetadata);
  const generateUploadUrlWithPrefix = useMutation(convexApi.v1.upload.generateUploadUrlWithPrefix);

  const upload = useCallback(
    async (file: File, options?: { onUploadProgress?: OnUploadProgressCallback, prefix?: string, key?: string }) => {
      setUploading(true);
      try {
        const { url, key } = options?.key ? await generateUploadUrlWithPrefix({ key: options.key }) : hasPrefix ? await generateUploadUrlWithPrefix({ prefix: options?.prefix || "temp/" }) : await generateUploadUrl();
        console.log(url, key)
        const result = await fetchWithUploadProgress(url, {
          method: "PUT",
          headers: { "Content-Type": file.type, "Cache-Control": "public, max-age=31536000" },
          body: file,
          onUploadProgress: options?.onUploadProgress,
        });
        if (!result.ok) {
          setUploading(false);
          setError(`Failed to upload image: ${result.statusText}`);
          throw new Error(`Failed to upload image: ${result.statusText}`);
        } else {
          setUploading(false);
        }
        await syncMetadata({ key });
        return key;
      } catch (error) {
        setUploading(false);
        setError(error as string);
        if ((error as any)?.data) {
          // toast({
          //   title: "Error",
          //   description: (error as any)?.data,
          //   variant: "destructive",
          // })
          console.log(error)
        }
        throw new Error(`Failed to upload image: ${error}`);
      }

    },
    [generateUploadUrl, syncMetadata]
  );

  return {
    upload,
    uploading,
    error
  }

}

export function useUserQuery<Query extends FunctionReference<"query">>(
  query: Query,
  ...queryArgs: OptionalRestArgsOrSkip<Query>
): FunctionReturnType<Query> | undefined {
  const user = useQuery(api.auth.getCurrentUser);
  const data = useQuery(query, user ? queryArgs[0] || {} : "skip")

  return data
}