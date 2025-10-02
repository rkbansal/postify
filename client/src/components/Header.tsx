import {
  Avatar,
  Badge,
  Box,
  Button,
  Group,
  Menu,
  Paper,
  Text,
  Title,
  UnstyledButton,
} from "@mantine/core";
import {
  IconChevronDown,
  IconHistory,
  IconLogin,
  IconLogout,
  IconSettings,
  IconUser,
} from "@tabler/icons-react";
import React from "react";
import { useAuth } from "../contexts/AuthContext";

interface HeaderProps {
  onHistoryClick?: () => void;
  onSettingsClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onHistoryClick,
  onSettingsClick,
}) => {
  const { user, login, logout, loading } = useAuth();

  return (
    <Paper shadow="sm" p="md" mb="md">
      <Group justify="space-between">
        {/* Logo */}
        <Group>
          <Title order={2} c="blue" fw={900}>
            Postify
          </Title>
          <Badge variant="light" color="blue" size="sm">
            AI-Powered
          </Badge>
        </Group>

        {/* User Section */}
        <Group>
          {loading ? (
            <Text size="sm" c="dimmed">
              Loading...
            </Text>
          ) : user ? (
            <Group gap="xs">
              {/* User Stats */}
              {user.stats.totalGenerations > 0 && (
                <Badge variant="light" color="green" size="sm">
                  {user.stats.totalGenerations} posts generated
                </Badge>
              )}

              {/* User Menu */}
              <Menu shadow="md" width={200}>
                <Menu.Target>
                  <UnstyledButton>
                    <Group gap="xs">
                      <Avatar
                        src={user.picture}
                        alt={user.name}
                        size="sm"
                        radius="xl"
                      />
                      <Box style={{ flex: 1 }}>
                        <Text size="sm" fw={500}>
                          {user.name}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {user.email}
                        </Text>
                      </Box>
                      <IconChevronDown size={14} />
                    </Group>
                  </UnstyledButton>
                </Menu.Target>

                <Menu.Dropdown>
                  <Menu.Label>Account</Menu.Label>

                  <Menu.Item leftSection={<IconUser size={14} />} disabled>
                    Profile
                  </Menu.Item>

                  {onSettingsClick && (
                    <Menu.Item
                      leftSection={<IconSettings size={14} />}
                      onClick={onSettingsClick}
                    >
                      Preferences
                    </Menu.Item>
                  )}

                  {onHistoryClick && (
                    <Menu.Item
                      leftSection={<IconHistory size={14} />}
                      onClick={onHistoryClick}
                    >
                      Post History
                    </Menu.Item>
                  )}

                  <Menu.Divider />

                  <Menu.Item
                    leftSection={<IconLogout size={14} />}
                    color="red"
                    onClick={logout}
                  >
                    Logout
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            </Group>
          ) : (
            <Button
              leftSection={<IconLogin size={16} />}
              variant="light"
              onClick={login}
            >
              Sign in with Google
            </Button>
          )}
        </Group>
      </Group>
    </Paper>
  );
};
