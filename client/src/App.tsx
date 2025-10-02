import {
  ActionIcon,
  Alert,
  AppShell,
  Badge,
  Box,
  Button,
  Container,
  Divider,
  Group,
  Loader,
  MultiSelect,
  Paper,
  Select,
  Stack,
  Tabs,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import {
  IconAlertCircle,
  IconBookmark,
  IconBrandInstagram,
  IconBrandLinkedin,
  IconBrandTwitter,
  IconCheck,
  IconCopy,
  IconLink,
  IconSend,
} from "@tabler/icons-react";
import React, { useState } from "react";
import { Header } from "./components/Header";
import { PostHistory } from "./components/PostHistory";
import { AuthProvider, useAuth } from "./contexts/AuthContext";

interface GenerateRequest {
  url: string;
  tone: string;
  platforms: string[];
  hashtags: string[];
  cta: string;
}

interface GenerateResponse {
  id?: string;
  title: string;
  source: {
    url: string;
    site: string;
    author: string;
  };
  summary: string;
  posts: {
    twitter?: string;
    linkedin?: string;
    instagram?: string;
  };
  savedToHistory: boolean;
}

const toneOptions = [
  { value: "Professional", label: "Professional" },
  { value: "Witty", label: "Witty" },
  { value: "Punchy", label: "Punchy" },
  { value: "Neutral", label: "Neutral" },
];

const platformOptions = [
  { value: "Twitter", label: "Twitter" },
  { value: "LinkedIn", label: "LinkedIn" },
  { value: "Instagram", label: "Instagram" },
];

const MainApp = () => {
  const { user, refreshUser, login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GenerateResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedPlatform, setCopiedPlatform] = useState<string | null>(null);
  const [historyOpened, setHistoryOpened] = useState(false);

  const form = useForm<GenerateRequest>({
    initialValues: {
      url: "",
      tone: user?.preferences.defaultTone || "Professional",
      platforms: user?.preferences.defaultPlatforms || ["Twitter"],
      hashtags: user?.preferences.defaultHashtags || [],
      cta: "",
    },
    validate: {
      url: (value) => {
        try {
          new URL(value);
          return null;
        } catch {
          return "Please enter a valid URL";
        }
      },
      platforms: (value) =>
        value.length === 0 ? "Select at least one platform" : null,
    },
  });

  // Update form defaults when user preferences change
  React.useEffect(() => {
    if (user?.preferences) {
      form.setValues({
        tone: user.preferences.defaultTone,
        platforms: user.preferences.defaultPlatforms,
        hashtags: user.preferences.defaultHashtags,
      });
    }
  }, [user?.preferences]);

  const handleSubmit = async (values: GenerateRequest) => {
    // Check if user is authenticated
    if (!user) {
      setError("Please log in to generate posts");
      notifications.show({
        title: "Authentication Required",
        message: "Please log in to generate posts",
        color: "red",
        icon: <IconAlertCircle size={16} />,
      });
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Parse hashtags from comma-separated string if needed
      const hashtags = Array.isArray(values.hashtags)
        ? values.hashtags
        : typeof values.hashtags === "string"
        ? (values.hashtags as string)
            .split(",")
            .map((h: string) => h.trim())
            .filter((h: string) => h.length > 0)
        : [];

      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3001";
      const response = await fetch(`${apiUrl}/api/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Include cookies for authentication
        body: JSON.stringify({
          ...values,
          hashtags,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate posts");
      }

      const data: GenerateResponse = await response.json();
      setResult(data);

      // Refresh user stats if logged in and post was saved
      if (user && data.savedToHistory) {
        refreshUser();
      }

      notifications.show({
        title: "Success!",
        message: data.savedToHistory
          ? "Posts generated and saved to history"
          : "Posts generated successfully",
        color: "green",
        icon: data.savedToHistory ? (
          <IconBookmark size={16} />
        ) : (
          <IconCheck size={16} />
        ),
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An unexpected error occurred";
      setError(errorMessage);

      notifications.show({
        title: "Error",
        message: errorMessage,
        color: "red",
        icon: <IconAlertCircle size={16} />,
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, platform: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedPlatform(platform);
      setTimeout(() => setCopiedPlatform(null), 2000);

      notifications.show({
        title: "Copied!",
        message: `${platform} post copied to clipboard`,
        color: "blue",
        icon: <IconCopy size={16} />,
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

  return (
    <AppShell>
      <AppShell.Main>
        <Container size="md" py="xl">
          <Stack gap="xl">
            {/* Header */}
            <Header
              onHistoryClick={() => setHistoryOpened(true)}
              onSettingsClick={() => {
                /* TODO: Implement settings */
              }}
            />

            {/* Welcome Message */}
            <Box ta="center">
              <Title order={1} size="h1" fw={900} c="blue">
                Postify
              </Title>
              <Text size="lg" c="dimmed" mt="xs">
                Transform any URL into engaging social media posts
              </Text>
              {user && (
                <Text size="sm" c="dimmed" mt="xs">
                  Welcome back, {user.name}!
                  {user.stats.totalGenerations > 0 && (
                    <>
                      {" "}
                      You've generated {user.stats.totalGenerations} posts so
                      far.
                    </>
                  )}
                </Text>
              )}
            </Box>

            {/* Form */}
            <Paper shadow="sm" p="xl" radius="md">
              <form onSubmit={form.onSubmit(handleSubmit)}>
                <Stack gap="md">
                  <TextInput
                    label="Article URL"
                    placeholder="https://example.com/article"
                    leftSection={<IconLink size={16} />}
                    required
                    {...form.getInputProps("url")}
                  />

                  <Group grow>
                    <Select
                      label="Tone"
                      data={toneOptions}
                      required
                      {...form.getInputProps("tone")}
                    />

                    <MultiSelect
                      label="Platforms"
                      data={platformOptions}
                      required
                      {...form.getInputProps("platforms")}
                    />
                  </Group>

                  <TextInput
                    label="Hashtags (optional)"
                    placeholder="tech, innovation, startup"
                    description="Comma-separated hashtags"
                    {...form.getInputProps("hashtags")}
                  />

                  <TextInput
                    label="Call-to-Action (optional)"
                    placeholder="Read more at..."
                    {...form.getInputProps("cta")}
                  />

                  <Button
                    type="submit"
                    loading={loading}
                    leftSection={<IconSend size={16} />}
                    size="md"
                    mt="md"
                    disabled={!user}
                  >
                    {loading ? "Generating Posts..." : "Generate Posts"}
                  </Button>

                  {!user && (
                    <Alert
                      icon={<IconAlertCircle size={16} />}
                      title="Login Required"
                      color="blue"
                      variant="light"
                      mt="sm"
                    >
                      <Text size="sm" mb="xs">
                        Please log in with Google to generate posts and save
                        them to your history.
                      </Text>
                      <Button size="xs" variant="filled" onClick={login}>
                        Login with Google
                      </Button>
                    </Alert>
                  )}
                </Stack>
              </form>
            </Paper>

            {/* Error Display */}
            {error && (
              <Alert
                icon={<IconAlertCircle size={16} />}
                title="Error"
                color="red"
                variant="light"
              >
                {error}
              </Alert>
            )}

            {/* Results */}
            {result && (
              <Paper shadow="sm" p="xl" radius="md">
                <Stack gap="lg">
                  {/* Article Info */}
                  <Box>
                    <Title order={3} size="h3" mb="xs">
                      {result.title}
                    </Title>
                    <Group gap="xs" mb="sm">
                      <Badge variant="light" color="blue">
                        {result.source.site}
                      </Badge>
                      {result.source.author && (
                        <Badge variant="light" color="gray">
                          by {result.source.author}
                        </Badge>
                      )}
                    </Group>
                    <Text size="sm" c="dimmed" mb="md">
                      {result.summary}
                    </Text>
                    <Divider />
                  </Box>

                  {/* Generated Posts */}
                  <Box>
                    <Title order={4} mb="md">
                      Generated Posts
                    </Title>

                    <Tabs
                      defaultValue={Object.keys(result.posts)[0]}
                      variant="pills"
                    >
                      <Tabs.List>
                        {Object.keys(result.posts).map((platform) => (
                          <Tabs.Tab
                            key={platform}
                            value={platform}
                            leftSection={getPlatformIcon(platform)}
                          >
                            {platform.charAt(0).toUpperCase() +
                              platform.slice(1)}
                          </Tabs.Tab>
                        ))}
                      </Tabs.List>

                      {Object.entries(result.posts).map(
                        ([platform, content]) => (
                          <Tabs.Panel key={platform} value={platform} pt="md">
                            <Paper
                              p="md"
                              bg="gray.0"
                              radius="md"
                              pos="relative"
                            >
                              <Text
                                size="sm"
                                style={{ whiteSpace: "pre-wrap" }}
                              >
                                {content}
                              </Text>
                              <ActionIcon
                                variant="subtle"
                                color={
                                  copiedPlatform === platform ? "green" : "blue"
                                }
                                pos="absolute"
                                top={8}
                                right={8}
                                onClick={() =>
                                  copyToClipboard(content!, platform)
                                }
                              >
                                {copiedPlatform === platform ? (
                                  <IconCheck size={16} />
                                ) : (
                                  <IconCopy size={16} />
                                )}
                              </ActionIcon>
                            </Paper>
                          </Tabs.Panel>
                        )
                      )}
                    </Tabs>
                  </Box>
                </Stack>
              </Paper>
            )}

            {/* Loading State */}
            {loading && (
              <Paper shadow="sm" p="xl" radius="md" ta="center">
                <Stack gap="md" align="center">
                  <Loader size="lg" />
                  <Text>Analyzing article and generating posts...</Text>
                  <Text size="sm" c="dimmed">
                    This may take a few moments
                  </Text>
                </Stack>
              </Paper>
            )}
          </Stack>
        </Container>
      </AppShell.Main>

      {/* Post History Modal */}
      <PostHistory
        opened={historyOpened}
        onClose={() => setHistoryOpened(false)}
      />
    </AppShell>
  );
};

function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

export default App;
