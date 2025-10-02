import {
  ActionIcon,
  Badge,
  Box,
  Center,
  Divider,
  Group,
  Loader,
  Menu,
  Modal,
  Pagination,
  Paper,
  Stack,
  Switch,
  Tabs,
  Text,
  Title,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconBrandInstagram,
  IconBrandLinkedin,
  IconBrandTwitter,
  IconCopy,
  IconDots,
  IconExternalLink,
  IconHeart,
  IconHeartFilled,
  IconTrash,
} from "@tabler/icons-react";
import React, { useEffect, useState } from "react";
import type { PostData } from "../hooks/usePosts";
import { usePosts } from "../hooks/usePosts";

interface PostHistoryProps {
  opened: boolean;
  onClose: () => void;
}

export const PostHistory: React.FC<PostHistoryProps> = ({
  opened,
  onClose,
}) => {
  const {
    posts,
    loading,
    pagination,
    fetchPosts,
    markAsCopied,
    toggleFavorite,
    deletePost,
  } = usePosts();
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  useEffect(() => {
    if (opened) {
      fetchPosts(1, showFavoritesOnly);
    }
  }, [opened, showFavoritesOnly]);

  const handlePageChange = (page: number) => {
    fetchPosts(page, showFavoritesOnly);
  };

  const copyToClipboard = async (
    text: string,
    platform: string,
    postId: string
  ) => {
    try {
      await navigator.clipboard.writeText(text);
      await markAsCopied(postId, platform);

      notifications.show({
        title: "Copied!",
        message: `${platform} post copied to clipboard`,
        color: "blue",
      });
    } catch {
      notifications.show({
        title: "Error",
        message: "Failed to copy to clipboard",
        color: "red",
      });
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case "twitter":
        return <IconBrandTwitter size={16} />;
      case "linkedin":
        return <IconBrandLinkedin size={16} />;
      case "instagram":
        return <IconBrandInstagram size={16} />;
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const PostCard: React.FC<{ post: PostData }> = ({ post }) => (
    <Paper p="md" shadow="sm" radius="md">
      <Stack gap="sm">
        {/* Header */}
        <Group justify="space-between">
          <Box style={{ flex: 1 }}>
            <Text fw={500} size="sm" lineClamp={2}>
              {post.article.title}
            </Text>
            <Group gap="xs" mt={4}>
              <Badge variant="light" size="xs">
                {post.article.source.site}
              </Badge>
              <Badge variant="light" color="gray" size="xs">
                {post.parameters.tone}
              </Badge>
              <Text size="xs" c="dimmed">
                {formatDate(post.createdAt)}
              </Text>
            </Group>
          </Box>

          <Menu shadow="md" width={200}>
            <Menu.Target>
              <ActionIcon variant="subtle" color="gray">
                <IconDots size={16} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item
                leftSection={<IconExternalLink size={14} />}
                onClick={() => window.open(post.article.url, "_blank")}
              >
                View Original
              </Menu.Item>
              <Menu.Item
                leftSection={
                  post.interactions.favorited ? (
                    <IconHeartFilled size={14} />
                  ) : (
                    <IconHeart size={14} />
                  )
                }
                color={post.interactions.favorited ? "red" : undefined}
                onClick={() => toggleFavorite(post._id)}
              >
                {post.interactions.favorited ? "Unfavorite" : "Favorite"}
              </Menu.Item>
              <Menu.Divider />
              <Menu.Item
                leftSection={<IconTrash size={14} />}
                color="red"
                onClick={() => deletePost(post._id)}
              >
                Delete
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>

        {/* Summary */}
        <Text size="sm" c="dimmed" lineClamp={2}>
          {post.article.summary}
        </Text>

        {/* Platforms */}
        <Group gap="xs">
          {post.parameters.platforms.map((platform) => (
            <Badge
              key={platform}
              variant="light"
              leftSection={getPlatformIcon(platform)}
              size="sm"
            >
              {platform}
            </Badge>
          ))}
        </Group>

        <Divider />

        {/* Generated Posts */}
        <Tabs
          defaultValue={Object.keys(post.generatedPosts)[0]}
          variant="pills"
        >
          <Tabs.List>
            {Object.keys(post.generatedPosts).map((platform) => (
              <Tabs.Tab
                key={platform}
                value={platform}
                leftSection={getPlatformIcon(platform)}
              >
                {platform.charAt(0).toUpperCase() + platform.slice(1)}
              </Tabs.Tab>
            ))}
          </Tabs.List>

          {Object.entries(post.generatedPosts).map(([platform, content]) => (
            <Tabs.Panel key={platform} value={platform} pt="sm">
              <Paper p="sm" bg="gray.0" radius="sm" pos="relative">
                <Text size="sm" style={{ whiteSpace: "pre-wrap" }}>
                  {content}
                </Text>
                <ActionIcon
                  variant="subtle"
                  color="blue"
                  pos="absolute"
                  top={8}
                  right={8}
                  onClick={() => copyToClipboard(content!, platform, post._id)}
                >
                  <IconCopy size={16} />
                </ActionIcon>
              </Paper>
            </Tabs.Panel>
          ))}
        </Tabs>
      </Stack>
    </Paper>
  );

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group>
          <Title order={3}>Post History</Title>
          {pagination.total > 0 && (
            <Badge variant="light">
              {pagination.total} post{pagination.total !== 1 ? "s" : ""}
            </Badge>
          )}
        </Group>
      }
      size="xl"
      centered
    >
      <Stack gap="md">
        {/* Filters */}
        <Group justify="space-between">
          <Switch
            label="Show favorites only"
            checked={showFavoritesOnly}
            onChange={(event) =>
              setShowFavoritesOnly(event.currentTarget.checked)
            }
          />
        </Group>

        {/* Content */}
        {loading ? (
          <Center py="xl">
            <Loader />
          </Center>
        ) : posts.length === 0 ? (
          <Center py="xl">
            <Stack align="center" gap="sm">
              <Text size="lg" c="dimmed">
                {showFavoritesOnly
                  ? "No favorite posts yet"
                  : "No posts generated yet"}
              </Text>
              <Text size="sm" c="dimmed">
                {showFavoritesOnly
                  ? "Favorite posts will appear here"
                  : "Start generating posts to see your history"}
              </Text>
            </Stack>
          </Center>
        ) : (
          <>
            {/* Posts */}
            <Stack gap="md">
              {posts.map((post) => (
                <PostCard key={post._id} post={post} />
              ))}
            </Stack>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <Center>
                <Pagination
                  value={pagination.page}
                  onChange={handlePageChange}
                  total={pagination.pages}
                />
              </Center>
            )}
          </>
        )}
      </Stack>
    </Modal>
  );
};
