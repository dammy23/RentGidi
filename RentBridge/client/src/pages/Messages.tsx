import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  useTheme,
  Snackbar,
  Alert,
  Drawer,
  IconButton,
  AppBar,
  Toolbar,
  Fade
} from '@mui/material';
import { ArrowBack, Chat, Close } from '@mui/icons-material';
import { ChatList } from '@/components/chat/ChatList';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/useToast';
import { useIsMobile } from '@/hooks/useMobile';
import { socketClient } from '@/utils/socketClient';
import {
  getUserConversationsList,
  getConversationByListing,
  sendMessage as sendMessageAPI
} from '@/api/messages';
import { motion, AnimatePresence } from 'framer-motion';

interface ConversationSummary {
  _id: string;
  listingId: string;
  property: {
    _id: string;
    title: string;
    images: string[];
    address: string;
  };
  otherParticipant: {
    _id: string;
    name: string;
    avatar?: string;
    role: string;
  };
  lastMessage?: {
    content: string;
    createdAt: string;
  };
  lastMessageAt: string;
  unreadCount: number;
}

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

export function Messages() {
  const { user } = useAuth();
  const { toast } = useToast();
  const theme = useTheme();
  const isMobile = useIsMobile();

  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null);
  const [currentConversation, setCurrentConversation] = useState<ConversationSummary | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Initialize socket connection
  useEffect(() => {
    if (user?.id) {
      const token = localStorage.getItem('accessToken');
      if (token) {
        socketClient.connect(token, user.id);
      }
    }

    return () => {
      socketClient.disconnect();
    };
  }, [user]);

  // Socket event listeners
  useEffect(() => {
    const handleMessageReceived = (event: CustomEvent) => {
      const message = event.detail;
      console.log('Messages: Received new message:', message);

      setMessages(prev => [...prev, message]);
      fetchConversations();
    };

    const handleMessageRead = (event: CustomEvent) => {
      const { messageId } = event.detail;
      setMessages(prev =>
        prev.map(msg =>
          msg._id === messageId ? { ...msg, isRead: true } : msg
        )
      );
    };

    const handleUserTyping = (event: CustomEvent) => {
      const { userId, listingId } = event.detail;
      if (listingId === selectedListingId) {
        setTypingUsers(prev => [...prev.filter(id => id !== userId), userId]);
      }
    };

    const handleUserStoppedTyping = (event: CustomEvent) => {
      const { userId } = event.detail;
      setTypingUsers(prev => prev.filter(id => id !== userId));
    };

    const handleSocketError = (event: CustomEvent) => {
      console.error('Socket error:', event.detail);
      setError('Connection lost. Trying to reconnect...');
    };

    window.addEventListener('socket-message-received', handleMessageReceived as EventListener);
    window.addEventListener('socket-message-read', handleMessageRead as EventListener);
    window.addEventListener('socket-user-typing', handleUserTyping as EventListener);
    window.addEventListener('socket-user-stopped-typing', handleUserStoppedTyping as EventListener);
    window.addEventListener('socket-connect-error', handleSocketError as EventListener);

    return () => {
      window.removeEventListener('socket-message-received', handleMessageReceived as EventListener);
      window.removeEventListener('socket-message-read', handleMessageRead as EventListener);
      window.removeEventListener('socket-user-typing', handleUserTyping as EventListener);
      window.removeEventListener('socket-user-stopped-typing', handleUserStoppedTyping as EventListener);
      window.removeEventListener('socket-connect-error', handleSocketError as EventListener);
    };
  }, [selectedListingId]);

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    try {
      console.log('Messages: Fetching conversations');
      const response = await getUserConversationsList();
      setConversations(response.conversations);

      // Auto-select first conversation if none selected and not on mobile
      if (!selectedListingId && response.conversations.length > 0 && !isMobile) {
        setSelectedListingId(response.conversations[0].listingId);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
      setError(error instanceof Error ? error.message : 'Failed to load conversations');
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load conversations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [selectedListingId, isMobile, toast]);

  // Fetch messages for selected conversation
  const fetchMessages = useCallback(async (listingId: string) => {
    if (!listingId) return;

    setMessagesLoading(true);
    try {
      console.log('Messages: Fetching messages for listing:', listingId);
      const response = await getConversationByListing(listingId);
      setMessages(response.messages);

      // Find and set current conversation
      const conversation = conversations.find(c => c.listingId === listingId);
      if (conversation) {
        setCurrentConversation(conversation);
      } else if (response.property) {
        // Create temporary conversation object if not in list yet
        setCurrentConversation({
          _id: 'temp',
          listingId,
          property: response.property,
          otherParticipant: response.property.owner,
          lastMessageAt: new Date().toISOString(),
          unreadCount: 0
        });
      }

      // Join socket room
      socketClient.joinRoom(listingId);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setError(error instanceof Error ? error.message : 'Failed to load messages');
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load messages",
        variant: "destructive",
      });
    } finally {
      setMessagesLoading(false);
    }
  }, [conversations, toast]);

  // Load initial data
  useEffect(() => {
    fetchConversations();
  }, []);

  // Load messages when conversation is selected
  useEffect(() => {
    if (selectedListingId) {
      fetchMessages(selectedListingId);
    }
  }, [selectedListingId, fetchMessages]);

  const handleSelectConversation = (listingId: string) => {
    setSelectedListingId(listingId);
    if (isMobile) {
      setMobileDrawerOpen(false);
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!selectedListingId || !currentConversation) return;

    try {
      // Send via Socket.IO for real-time delivery
      socketClient.sendMessage(
        selectedListingId,
        currentConversation.otherParticipant._id,
        content
      );

      // Also send via REST API for persistence
      await sendMessageAPI({
        listingId: selectedListingId,
        receiverId: currentConversation.otherParticipant._id,
        content
      });

    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send message",
        variant: "destructive",
      });
    }
  };

  const handleStartTyping = () => {
    if (selectedListingId) {
      socketClient.startTyping(selectedListingId);
    }
  };

  const handleStopTyping = () => {
    if (selectedListingId) {
      socketClient.stopTyping(selectedListingId);
    }
  };

  const handleBackToList = () => {
    if (isMobile) {
      setSelectedListingId(null);
      setMobileDrawerOpen(true);
    }
  };

  const handleCloseError = () => {
    setError(null);
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Messages
        </Typography>
        <Paper elevation={2} sx={{ p: 3, textAlign: 'center' }}>
          <Typography>Loading conversations...</Typography>
        </Paper>
      </Box>
    );
  }

  const chatListContent = (
    <ChatList
      conversations={conversations}
      selectedListingId={selectedListingId || undefined}
      onSelectConversation={handleSelectConversation}
      loading={loading}
    />
  );

  return (
    <Box sx={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ mb: 2, px: { xs: 1, sm: 0 } }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Messages
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Communicate with landlords and tenants
        </Typography>
      </Box>

      {/* Mobile Layout */}
      {isMobile ? (
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <AnimatePresence mode="wait">
            {!selectedListingId ? (
              <motion.div
                key="chat-list"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                style={{ height: '100%' }}
              >
                <Paper
                  elevation={1}
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: 2,
                  }}
                >
                  <AppBar position="static" elevation={0} sx={{ borderRadius: '8px 8px 0 0' }}>
                    <Toolbar>
                      <Chat sx={{ mr: 1 }} />
                      <Typography variant="h6">Conversations</Typography>
                    </Toolbar>
                  </AppBar>
                  <Box sx={{ flex: 1, overflow: 'hidden' }}>
                    {chatListContent}
                  </Box>
                </Paper>
              </motion.div>
            ) : (
              <motion.div
                key="chat-window"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                style={{ height: '100%' }}
              >
                <Paper
                  elevation={1}
                  sx={{
                    height: '100%',
                    borderRadius: 2,
                    overflow: 'hidden',
                  }}
                >
                  <ChatWindow
                    messages={messages}
                    property={currentConversation?.property || null}
                    otherParticipant={currentConversation?.otherParticipant || null}
                    currentUserId={user?.id || ''}
                    onSendMessage={handleSendMessage}
                    onStartTyping={handleStartTyping}
                    onStopTyping={handleStopTyping}
                    onBack={handleBackToList}
                    loading={messagesLoading}
                    error={error || undefined}
                    typingUsers={typingUsers}
                    isMobile={isMobile}
                  />
                </Paper>
              </motion.div>
            )}
          </AnimatePresence>
        </Box>
      ) : (
        /* Desktop Layout */
        <Box sx={{ flex: 1 }}>
          <Grid container spacing={2} sx={{ height: '100%' }}>
            {/* Conversations Sidebar */}
            <Grid item xs={12} md={4}>
              <Paper
                elevation={1}
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: 2,
                }}
              >
                <Box
                  sx={{
                    p: 2,
                    borderBottom: `1px solid ${theme.palette.divider}`,
                    backgroundColor: theme.palette.primary.main,
                    color: theme.palette.primary.contrastText,
                    borderRadius: '8px 8px 0 0',
                  }}
                >
                  <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chat />
                    Conversations
                  </Typography>
                </Box>
                <Box sx={{ flex: 1, overflow: 'hidden' }}>
                  {chatListContent}
                </Box>
              </Paper>
            </Grid>

            {/* Chat Window */}
            <Grid item xs={12} md={8}>
              <Paper
                elevation={1}
                sx={{
                  height: '100%',
                  borderRadius: 2,
                  overflow: 'hidden',
                }}
              >
                <ChatWindow
                  messages={messages}
                  property={currentConversation?.property || null}
                  otherParticipant={currentConversation?.otherParticipant || null}
                  currentUserId={user?.id || ''}
                  onSendMessage={handleSendMessage}
                  onStartTyping={handleStartTyping}
                  onStopTyping={handleStopTyping}
                  loading={messagesLoading}
                  error={error || undefined}
                  typingUsers={typingUsers}
                  isMobile={isMobile}
                />
              </Paper>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Error Snackbar */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={handleCloseError}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseError}
          severity="error"
          variant="filled"
          sx={{ borderRadius: 2 }}
          action={
            <IconButton
              size="small"
              aria-label="close"
              color="inherit"
              onClick={handleCloseError}
            >
              <Close fontSize="small" />
            </IconButton>
          }
        >
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
}