# Postify Client

React frontend for the Postify URL-to-Post generator.

## Tech Stack

- **React 19** with TypeScript
- **Mantine UI** for components and styling
- **Vite** for build tooling and development server
- **Tabler Icons** for iconography

## Development

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview
```

## Environment Variables

Create a `.env` file:

```env
VITE_API_URL=http://localhost:3001
```

## Deployment

This app is optimized for Vercel deployment:

1. Connect your GitHub repository to Vercel
2. Set the root directory to `client`
3. Configure environment variables in Vercel dashboard
4. Deploy automatically on push to main branch

## Features

- Responsive design with Mantine components
- Form validation with real-time feedback
- Loading states and error handling
- Copy-to-clipboard functionality
- Tabbed interface for multi-platform results
- Toast notifications for user feedback
