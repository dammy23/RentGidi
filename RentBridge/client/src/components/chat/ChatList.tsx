import React from 'react';
import {
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Badge,
  Typography,
  Box,
  Divider,
  useTheme,
  Paper,
  Chip
} from '@mui/material';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';

interface ConversationSummary {
  _id: string;
  listingId: string;
  property: {
    _id: string;
    title: string;
    images: string[];
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

interface ChatListProps {
  conversations: ConversationSummary[];
  selectedListingId?: string;
  onSelectConversation: (listingId: string) => void;
  loading?: boolean;
}

export const ChatList: React.FC<ChatListProps> = ({
  conversations,
  selectedListingId,
  onSelectConversation,
  loading = false
}) => {
  const theme = useTheme();

  if (loading) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Loading conversations...
        </Typography>
      </Box>
    );
  }

  if (conversations.length === 0) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No conversations yet
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Start a conversation by messaging about a property
        </Typography>
      </Box>
    );
  }

  return (
    <Paper 
      elevation={0} 
      sx={{ 
        height: '100%', 
        backgroundColor: 'background.paper',
        borderRadius: 0
      }}
    >
      <List sx={{ p: 0 }}>
        {conversations.map((conversation, index) => {
          const isSelected = selectedListingId === conversation.listingId;
          const otherParticipant = conversation.otherParticipant;
          const roleColor = otherParticipant.role === 'landlord'
            ? theme.palette.primary.main
            : theme.palette.secondary.main;

          return (
            <motion.div
              key={conversation._id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
            >
              <ListItem
                button
                selected={isSelected}
                onClick={() => onSelectConversation(conversation.listingId)}
                sx={{
                  py: 2,
                  px: 2,
                  backgroundColor: isSelected 
                    ? theme.palette.action.selected 
                    : 'transparent',
                  borderLeft: isSelected 
                    ? `4px solid ${theme.palette.primary.main}` 
                    : '4px solid transparent',
                  '&:hover': {
                    backgroundColor: theme.palette.action.hover,
                  },
                  transition: 'all 0.2s ease-in-out',
                }}
              >
                <ListItemAvatar>
                  <Badge
                    badgeContent={conversation.unreadCount}
                    color="error"
                    invisible={conversation.unreadCount === 0}
                    sx={{
                      '& .MuiBadge-badge': {
                        fontSize: '0.75rem',
                        minWidth: '20px',
                        height: '20px',
                        fontWeight: 600,
                      },
                    }}
                  >
                    <Avatar
                      src={otherParticipant.avatar}
                      sx={{
                        bgcolor: roleColor,
                        width: 52,
                        height: 52,
                        fontSize: '1.2rem',
                        fontWeight: 600,
                        boxShadow: theme.shadows[2],
                      }}
                    >
                      {otherParticipant.name.charAt(0).toUpperCase()}
                    </Avatar>
                  </Badge>
                </ListItemAvatar>

                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Typography
                        variant="subtitle1"
                        component="span"
                        sx={{
                          fontWeight: conversation.unreadCount > 0 ? 600 : 500,
                          color: 'text.primary',
                          fontSize: '1rem',
                        }}
                      >
                        {otherParticipant.name}
                      </Typography>
                      <Chip
                        label={otherParticipant.role}
                        size="small"
                        color={otherParticipant.role === 'landlord' ? 'primary' : 'secondary'}
                        sx={{ 
                          height: 20,
                          fontSize: '0.7rem',
                          fontWeight: 500,
                          textTransform: 'capitalize',
                        }}
                      />
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          fontWeight: 500,
                          mb: 0.5,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          fontSize: '0.9rem',
                        }}
                      >
                        {conversation.property.title}
                      </Typography>
                      {conversation.lastMessage && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            fontWeight: conversation.unreadCount > 0 ? 500 : 400,
                            fontSize: '0.85rem',
                            maxWidth: '200px',
                          }}
                        >
                          {conversation.lastMessage.content}
                        </Typography>
                      )}
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ 
                          mt: 0.5, 
                          display: 'block',
                          fontSize: '0.75rem',
                          fontWeight: conversation.unreadCount > 0 ? 500 : 400,
                        }}
                      >
                        {formatDistanceToNow(new Date(conversation.lastMessageAt), { addSuffix: true })}
                      </Typography>
                    </Box>
                  }
                />
              </ListItem>
              {index < conversations.length - 1 && (
                <Divider 
                  variant="inset" 
                  component="li" 
                  sx={{ ml: 9, opacity: 0.6 }} 
                />
              )}
            </motion.div>
          );
        })}
      </List>
    </Paper>
  );
};