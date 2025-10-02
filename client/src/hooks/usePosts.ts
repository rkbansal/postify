import { notifications } from "@mantine/notifications";
import { useState } from "react";

export interface PostData {
  _id: string;
  article: {
    url: string;
    title: string;
    source: {
      site: string;
      author: string;
    };
    summary: string;
  };
  parameters: {
    tone: string;
    platforms: string[];
    hashtags: string[];
    cta: string;
  };
  generatedPosts: {
    twitter?: string;
    linkedin?: string;
    instagram?: string;
  };
  interactions: {
    copied: Array<{
      platform: string;
      copiedAt: string;
    }>;
    favorited: boolean;
    favoritedAt?: string;
  };
  createdAt: string;
}

interface PostsResponse {
  posts: PostData[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export const usePosts = () => {
  const [posts, setPosts] = useState<PostData[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });

  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3001";

  const fetchPosts = async (page = 1, favorited?: boolean) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
      });

      if (favorited !== undefined) {
        params.append("favorited", favorited.toString());
      }

      const response = await fetch(`${apiUrl}/api/posts?${params}`, {
        credentials: "include",
      });

      if (response.ok) {
        const data: PostsResponse = await response.json();
        setPosts(data.posts);
        setPagination(data.pagination);
      } else if (response.status === 401) {
        // User not authenticated
        setPosts([]);
        setPagination({ page: 1, limit: 10, total: 0, pages: 0 });
      } else {
        throw new Error("Failed to fetch posts");
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
      notifications.show({
        title: "Error",
        message: "Failed to load post history",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  const markAsCopied = async (postId: string, platform: string) => {
    try {
      const response = await fetch(`${apiUrl}/api/posts/${postId}/copy`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ platform }),
      });

      if (response.ok) {
        // Update local state
        setPosts((prev) =>
          prev.map((post) =>
            post._id === postId
              ? {
                  ...post,
                  interactions: {
                    ...post.interactions,
                    copied: [
                      ...post.interactions.copied,
                      {
                        platform,
                        copiedAt: new Date().toISOString(),
                      },
                    ],
                  },
                }
              : post
          )
        );
      }
    } catch (error) {
      console.error("Error marking as copied:", error);
    }
  };

  const toggleFavorite = async (postId: string) => {
    try {
      const response = await fetch(`${apiUrl}/api/posts/${postId}/favorite`, {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();

        // Update local state
        setPosts((prev) =>
          prev.map((post) =>
            post._id === postId
              ? {
                  ...post,
                  interactions: {
                    ...post.interactions,
                    favorited: data.favorited,
                    favoritedAt: data.favorited
                      ? new Date().toISOString()
                      : undefined,
                  },
                }
              : post
          )
        );

        notifications.show({
          title: data.favorited ? "Favorited" : "Unfavorited",
          message: `Post ${
            data.favorited ? "added to" : "removed from"
          } favorites`,
          color: data.favorited ? "green" : "blue",
        });
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      notifications.show({
        title: "Error",
        message: "Failed to update favorite status",
        color: "red",
      });
    }
  };

  const deletePost = async (postId: string) => {
    try {
      const response = await fetch(`${apiUrl}/api/posts/${postId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (response.ok) {
        // Remove from local state
        setPosts((prev) => prev.filter((post) => post._id !== postId));

        notifications.show({
          title: "Deleted",
          message: "Post deleted successfully",
          color: "green",
        });
      }
    } catch (error) {
      console.error("Error deleting post:", error);
      notifications.show({
        title: "Error",
        message: "Failed to delete post",
        color: "red",
      });
    }
  };

  return {
    posts,
    loading,
    pagination,
    fetchPosts,
    markAsCopied,
    toggleFavorite,
    deletePost,
  };
};
