import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Avatar,
  IconButton,
  Divider,
  useTheme,
  Chip,
  CircularProgress,
  Alert,
  AppBar,
  Toolbar
} from '@mui/material';
import { Phone, VideoCall, MoreVert, ArrowBack, Info } from '@mui/icons-material';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { motion, AnimatePresence } from 'framer-motion';

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

interface Property {
  _id: string;
  title: string;
  images: string[];
  address: string;
}

interface Participant {
  _id: string;
  name: string;
  avatar?: string;
  role: string;
}

interface ChatWindowProps {
  messages: Message[];
  property: Property | null;
  otherParticipant: Participant | null;
  currentUserId: string;
  onSendMessage: (content: string) => void;
  onStartTyping?: () => void;
  onStopTyping?: () => void;
  onBack?: () => void;
  loading?: boolean;
  error?: string;
  typingUsers?: string[];
  isMobile?: boolean;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  messages,
  property,
  otherParticipant,
  currentUserId,
  onSendMessage,
  onStartTyping,
  onStopTyping,
  onBack,
  loading = false,
  error,
  typingUsers = [],
  isMobile = false
}) => {
  const theme = useTheme();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (autoScroll) {
      scrollToBottom();
    }
  }, [messages, autoScroll]);

  const handleScroll = () => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10;
      setAutoScroll(isAtBottom);
    }
  };

  if (!property || !otherParticipant) {
    return (
      <Paper
        elevation={0}
        sx={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.palette.background.default,
          borderRadius: 0,
        }}
      >
        <Box sx={{ textAlign: 'center', p: 4 }}>
          <Typography variant="h5" color="text.secondary" gutterBottom>
            Select a conversation
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Choose a conversation from the list to start messaging
          </Typography>
        </Box>
      </Paper>
    );
  }

  const roleColor = otherParticipant.role === 'landlord'
    ? theme.palette.primary.main
    : theme.palette.secondary.main;

  return (
    <Paper
      elevation={0}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: theme.palette.background.paper,
        borderRadius: 0,
      }}
    >
      {/* Header */}
      <AppBar 
        position="static" 
        elevation={1}
        sx={{
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary,
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Toolbar sx={{ px: { xs: 1, sm: 2 } }}>
          {isMobile && onBack && (
            <IconButton
              edge="start"
              onClick={onBack}
              sx={{ mr: 1 }}
            >
              <ArrowBack />
            </IconButton>
          )}

          <Avatar
            src={otherParticipant.avatar}
            sx={{
              bgcolor: roleColor,
              width: 44,
              height: 44,
              mr: 2,
              boxShadow: theme.shadows[2],
            }}
          >
            {otherParticipant.name.charAt(0).toUpperCase()}
          </Avatar>

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h6" component="h2" noWrap>
                {otherParticipant.name}
              </Typography>
              <Chip
                label={otherParticipant.role}
                size="small"
                color={otherParticipant.role === 'landlord' ? 'primary' : 'secondary'}
                sx={{ 
                  textTransform: 'capitalize',
                  height: 22,
                  fontSize: '0.7rem',
                }}
              />
            </Box>
            <Typography
              variant="body2"
              color="text.secondary"
              noWrap
              sx={{ fontSize: '0.85rem' }}
            >
              {property.title}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <IconButton 
              color="primary"
              sx={{ display: { xs: 'none', sm: 'flex' } }}
            >
              <Phone />
            </IconButton>
            <IconButton 
              color="primary"
              sx={{ display: { xs: 'none', sm: 'flex' } }}
            >
              <VideoCall />
            </IconButton>
            <IconButton>
              <Info />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Messages Area */}
      <Box
        ref={messagesContainerRef}
        onScroll={handleScroll}
        sx={{
          flex: 1,
          overflowY: 'auto',
          backgroundColor: '#f5f5f5',
          backgroundImage: `
            radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0);
          `,
          backgroundSize: '20px 20px',
          position: 'relative',
        }}
      >
        {error && (
          <Box sx={{ p: 2 }}>
            <Alert severity="error" sx={{ borderRadius: 2 }}>
              {error}
            </Alert>
          </Box>
        )}

        {loading ? (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '200px',
            }}
          >
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ py: 2, px: 1 }}>
            <AnimatePresence>
              {messages.map((message, index) => {
                const isOwn = message.sender._id === currentUserId;
                const showAvatar = index === 0 ||
                  messages[index - 1].sender._id !== message.sender._id;
                const showTimestamp = index === messages.length - 1 ||
                  messages[index + 1].sender._id !== message.sender._id ||
                  new Date(messages[index + 1].createdAt).getTime() -
                  new Date(message.createdAt).getTime() > 300000; // 5 minutes

                return (
                  <MessageBubble
                    key={message._id}
                    message={message}
                    isOwn={isOwn}
                    showAvatar={showAvatar}
                    showTimestamp={showTimestamp}
                  />
                );
              })}
            </AnimatePresence>

            {/* Typing Indicator */}
            <AnimatePresence>
              {typingUsers.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <Box sx={{ px: 2, py: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar
                      src={otherParticipant.avatar}
                      sx={{
                        width: 24,
                        height: 24,
                        bgcolor: roleColor,
                        fontSize: '0.75rem',
                      }}
                    >
                      {otherParticipant.name.charAt(0).toUpperCase()}
                    </Avatar>
                    <Paper
                      elevation={1}
                      sx={{
                        px: 3,
                        py: 1.5,
                        backgroundColor: theme.palette.grey[100],
                        borderRadius: '20px 20px 20px 5px',
                        display: 'inline-block',
                      }}
                    >
                      <Typography 
                        variant="body2" 
                        color="text.secondary"
                        sx={{ 
                          fontStyle: 'italic',
                          fontSize: '0.85rem',
                        }}
                      >
                        {otherParticipant.name} is typing...
                      </Typography>
                    </Paper>
                  </Box>
                </motion.div>
              )}
            </AnimatePresence>

            <div ref={messagesEndRef} />
          </Box>
        )}
      </Box>

      {/* Message Input */}
      <MessageInput
        onSendMessage={onSendMessage}
        onStartTyping={onStartTyping}
        onStopTyping={onStopTyping}
        disabled={loading}
        placeholder={`Message ${otherParticipant.name}...`}
      />
    </Paper>
  );
};