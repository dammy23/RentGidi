import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Textarea } from "./ui/textarea"
import { Label } from "./ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { MessageSquare, Send } from "lucide-react"
import { sendMessage } from "@/api/messages"
import { useToast } from "@/hooks/useToast"

interface ContactLandlordDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  landlord: any
  property: any
}

export function ContactLandlordDialog({ open, onOpenChange, landlord, property }: ContactLandlordDialogProps) {
  const { toast } = useToast()
  const [message, setMessage] = useState("")
  const [subject, setSubject] = useState(`Inquiry about ${property?.title}`)
  const [loading, setLoading] = useState(false)

  const handleSendMessage = async () => {
    if (!message.trim()) {
      toast({
        title: "Error",
        description: "Please enter a message",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      console.log('Sending message to landlord')
      await sendMessage({
        recipientId: landlord._id,
        propertyId: property._id,
        subject,
        message
      })
      
      toast({
        title: "Message sent",
        description: "Your message has been sent to the property owner",
      })
      
      setMessage("")
      onOpenChange(false)
    } catch (error) {
      console.error('Error sending message:', error)
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const quickMessages = [
    "Hi, I'm interested in viewing this property. When would be a good time?",
    "Is this property still available for rent?",
    "Could you provide more details about the lease terms?",
    "I'd like to schedule a viewing at your earliest convenience."
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Contact Property Owner
          </DialogTitle>
          <DialogDescription>
            Send a message to inquire about this property
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Landlord Info */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Avatar>
              <AvatarImage src={landlord?.avatar} />
              <AvatarFallback>{landlord?.name?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{landlord?.name}</p>
              <p className="text-sm text-muted-foreground">
                Typically responds in {landlord?.responseTime}
              </p>
            </div>
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter subject"
            />
          </div>

          {/* Quick Messages */}
          <div className="space-y-2">
            <Label>Quick messages</Label>
            <div className="space-y-2">
              {quickMessages.map((quickMessage, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="w-full text-left justify-start h-auto p-2 text-wrap"
                  onClick={() => setMessage(quickMessage)}
                >
                  {quickMessage}
                </Button>
              ))}
            </div>
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message here..."
              rows={4}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendMessage}
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              <Send className="h-4 w-4 mr-2" />
              {loading ? "Sending..." : "Send Message"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}