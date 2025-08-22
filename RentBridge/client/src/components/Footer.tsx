import { Box, Typography, Link, useTheme, alpha } from '@mui/material'

export function Footer() {
  const theme = useTheme()

  return (
    <Box
      component="footer"
      sx={{
        py: 2,
        px: 3,
        mt: 'auto',
        backgroundColor: alpha(theme.palette.background.paper, 0.8),
        backdropFilter: 'blur(10px)',
        borderTop: `1px solid ${theme.palette.divider}`,
      }}
    >
      <Box sx={{ maxWidth: 1200, mx: 'auto', textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Built with ❤️ by{' '}
          <Link
            href="https://autom8.com.ng"
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              color: theme.palette.primary.main,
              textDecoration: 'none',
              fontWeight: 600,
              '&:hover': {
                textDecoration: 'underline',
              },
            }}
          >
            Autom8
          </Link>
        </Typography>
      </Box>
    </Box>
  )
}