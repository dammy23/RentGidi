import React from 'react';
import {
  Box,
  Typography,
  Paper,
  useTheme,
  Avatar
} from '@mui/material';
import { motion } from 'framer-motion';
import { format, isToday, isYesterday } from 'date-fns';
import { CheckCircle, Schedule, Done, DoneAll } from '@mui/icons-material';

interface Message {
  _id: string;
  content: string;
  sender: {
    _id: string;
    name: string;
    role: string;
  };
  createdAt: string;
  isRead: boolean;
}

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showAvatar?: boolean;
  showTimestamp?: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwn,
  showAvatar = true,
  showTimestamp = true
}) => {
  const theme = useTheme();

  const formatMessageTime = (date: Date) => {
    if (isToday(date)) {
      return format(date, 'HH:mm');
    } else if (isYesterday(date)) {
      return `Yesterday ${format(date, 'HH:mm')}`;
    } else {
      return format(date, 'MMM d, HH:mm');
    }
  };

  const getBubbleColor = () => {
    if (isOwn) {
      return message.sender.role === 'landlord'
        ? theme.palette.primary.main
        : theme.palette.secondary.main;
    }
    return theme.palette.grey[100];
  };

  const getTextColor = () => {
    return isOwn ? theme.palette.common.white : theme.palette.text.primary;
  };

  const roleColor = message.sender.role === 'landlord'
    ? theme.palette.primary.main
    : theme.palette.secondary.main;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        duration: 0.3,
        type: "spring",
        stiffness: 500,
        damping: 30
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: isOwn ? 'flex-end' : 'flex-start',
          mb: 1,
          px: 2,
          alignItems: 'flex-end',
          gap: 1,
        }}
      >
        {/* Avatar for other user's messages */}
        {!isOwn && showAvatar && (
          <Avatar
            sx={{
              bgcolor: roleColor,
              width: 32,
              height: 32,
              fontSize: '0.8rem',
              mb: 0.5,
            }}
          >
            {message.sender.name.charAt(0).toUpperCase()}
          </Avatar>
        )}

        {/* Spacer when no avatar */}
        {!isOwn && !showAvatar && (
          <Box sx={{ width: 32 }} />
        )}

        <Box
          sx={{
            maxWidth: '75%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: isOwn ? 'flex-end' : 'flex-start',
          }}
        >
          <Paper
            elevation={2}
            sx={{
              px: 2,
              py: 1.5,
              backgroundColor: getBubbleColor(),
              color: getTextColor(),
              borderRadius: isOwn 
                ? '20px 20px 5px 20px' 
                : '20px 20px 20px 5px',
              position: 'relative',
              boxShadow: theme.shadows[1],
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                boxShadow: theme.shadows[3],
              },
            }}
          >
            <Typography
              variant="body1"
              sx={{
                wordBreak: 'break-word',
                lineHeight: 1.4,
                fontSize: '0.95rem',
              }}
            >
              {message.content}
            </Typography>
          </Paper>

          {showTimestamp && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                mt: 0.5,
                px: 1,
              }}
            >
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ 
                  fontSize: '0.7rem',
                  fontWeight: 400,
                }}
              >
                {formatMessageTime(new Date(message.createdAt))}
              </Typography>

              {isOwn && (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {message.isRead ? (
                    <DoneAll
                      sx={{
                        fontSize: '0.9rem',
                        color: theme.palette.primary.main,
                      }}
                    />
                  ) : (
                    <Done
                      sx={{
                        fontSize: '0.9rem',
                        color: theme.palette.text.secondary,
                      }}
                    />
                  )}
                </Box>
              )}
            </Box>
          )}
        </Box>
      </Box>
    </motion.div>
  );
};