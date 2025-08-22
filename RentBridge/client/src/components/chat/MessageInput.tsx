import React, { useState, useRef } from 'react';
import {
  Box,
  TextField,
  IconButton,
  Paper,
  useTheme,
  Tooltip,
  Fade
} from '@mui/material';
import { Send, AttachFile, EmojiEmotions } from '@mui/icons-material';
import { motion } from 'framer-motion';

interface MessageInputProps {
  onSendMessage: (content: string) => void;
  onStartTyping?: () => void;
  onStopTyping?: () => void;
  disabled?: boolean;
  placeholder?: string;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  onStartTyping,
  onStopTyping,
  disabled = false,
  placeholder = "Type a message..."
}) => {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const theme = useTheme();

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setMessage(value);

    // Handle typing indicators
    if (value.trim() && !isTyping) {
      setIsTyping(true);
      onStartTyping?.();
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      onStopTyping?.();
    }, 1000);
  };

  const handleSendMessage = () => {
    const trimmedMessage = message.trim();
    if (trimmedMessage && !disabled) {
      onSendMessage(trimmedMessage);
      setMessage('');

      // Clear typing state
      if (isTyping) {
        setIsTyping(false);
        onStopTyping?.();
      }

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const canSend = message.trim().length > 0 && !disabled;

  return (
    <Paper
      elevation={3}
      sx={{
        p: 2,
        backgroundColor: theme.palette.background.paper,
        borderTop: `1px solid ${theme.palette.divider}`,
        borderRadius: 0,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1 }}>
        <Tooltip title="Attach file">
          <IconButton
            size="medium"
            disabled={disabled}
            sx={{ 
              mb: 0.5,
              color: theme.palette.text.secondary,
              '&:hover': {
                color: theme.palette.primary.main,
              },
            }}
          >
            <AttachFile />
          </IconButton>
        </Tooltip>

        <TextField
          fullWidth
          multiline
          maxRows={4}
          variant="outlined"
          placeholder={placeholder}
          value={message}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          disabled={disabled}
          size="small"
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '25px',
              backgroundColor: theme.palette.grey[50],
              paddingRight: '8px',
              '& fieldset': {
                border: `1px solid ${theme.palette.divider}`,
              },
              '&:hover fieldset': {
                borderColor: theme.palette.primary.main,
              },
              '&.Mui-focused fieldset': {
                borderColor: theme.palette.primary.main,
                borderWidth: '2px',
              },
            },
            '& .MuiInputBase-input': {
              padding: '12px 16px',
              fontSize: '0.95rem',
            },
          }}
        />

        <Tooltip title="Add emoji">
          <IconButton
            size="medium"
            disabled={disabled}
            sx={{ 
              mb: 0.5,
              color: theme.palette.text.secondary,
              '&:hover': {
                color: theme.palette.warning.main,
              },
            }}
          >
            <EmojiEmotions />
          </IconButton>
        </Tooltip>

        <Tooltip title="Send message">
          <span>
            <motion.div
              whileHover={{ scale: canSend ? 1.05 : 1 }}
              whileTap={{ scale: canSend ? 0.95 : 1 }}
            >
              <IconButton
                onClick={handleSendMessage}
                disabled={!canSend}
                sx={{
                  mb: 0.5,
                  width: 48,
                  height: 48,
                  backgroundColor: canSend 
                    ? theme.palette.primary.main 
                    : theme.palette.grey[300],
                  color: canSend 
                    ? theme.palette.primary.contrastText 
                    : theme.palette.text.disabled,
                  '&:hover': {
                    backgroundColor: canSend 
                      ? theme.palette.primary.dark 
                      : theme.palette.grey[300],
                  },
                  '&.Mui-disabled': {
                    backgroundColor: theme.palette.grey[200],
                  },
                  transition: 'all 0.2s ease-in-out',
                }}
              >
                <Send />
              </IconButton>
            </motion.div>
          </span>
        </Tooltip>
      </Box>
    </Paper>
  );
};