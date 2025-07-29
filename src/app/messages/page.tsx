import { AppSidebar } from "@/components/layout/AppSidebar";
import { MobileNav } from "@/components/layout/MobileNav";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { NeoButton } from "@/components/NeoButton";
import { mockUsers, mockConversations, mockMessages } from "@/lib/mock";
import type { Conversation, Message } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Search, Send } from "lucide-react";

function ConversationList() {
    return (
        <div className="border-r-2 border-foreground h-full flex flex-col">
            <div className="p-4 border-b-2 border-foreground">
                <h2 className="font-headline text-2xl font-bold">Messages</h2>
                <div className="relative mt-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input placeholder="Search messages..." className="pl-10 border-2 border-foreground" />
                </div>
            </div>
            <div className="flex-1 overflow-y-auto">
                <nav className="grid gap-px">
                    {mockConversations.map((convo, index) => (
                        <button key={convo.id} className={cn("flex items-center gap-3 p-4 text-left transition-colors hover:bg-secondary", index === 0 && "bg-secondary")}>
                            <Avatar className="border-2 border-foreground">
                                <AvatarImage src={convo.participant.avatar} data-ai-hint="user avatar" />
                                <AvatarFallback>{convo.participant.name.slice(0, 2)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 overflow-hidden">
                                <p className="font-semibold truncate">{convo.participant.name}</p>
                                <p className="text-sm text-muted-foreground truncate">{convo.lastMessage.content}</p>
                            </div>
                            <span className="text-xs text-muted-foreground">{convo.lastMessage.timestamp}</span>
                        </button>
                    ))}
                </nav>
            </div>
        </div>
    )
}

function MessageView() {
    const conversationId = mockConversations[0].id;
    const messages = mockMessages[conversationId];
    const currentUser = mockUsers[0];

    return (
        <div className="flex flex-col h-full">
            <header className="flex items-center gap-4 p-4 border-b-2 border-foreground">
                <Avatar className="border-2 border-foreground">
                    <AvatarImage src={mockConversations[0].participant.avatar} data-ai-hint="user avatar" />
                    <AvatarFallback>{mockConversations[0].participant.name.slice(0, 2)}</AvatarFallback>
                </Avatar>
                <div>
                    <h3 className="font-semibold text-lg">{mockConversations[0].participant.name}</h3>
                    <p className="text-sm text-muted-foreground">{mockConversations[0].participant.role}</p>
                </div>
            </header>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {messages.map(message => (
                    <div key={message.id} className={cn("flex items-end gap-3", message.sender.id === currentUser.id ? 'flex-row-reverse' : '')}>
                        <Avatar className="h-8 w-8 border-2 border-foreground">
                            <AvatarImage src={message.sender.avatar} data-ai-hint="user avatar" />
                            <AvatarFallback>{message.sender.name.slice(0,2)}</AvatarFallback>
                        </Avatar>
                        <div className={cn("max-w-xs lg:max-w-md rounded-lg p-3", message.sender.id === currentUser.id ? "bg-primary text-primary-foreground" : "bg-card border-2 border-foreground")}>
                           <p>{message.content}</p>
                           <p className={cn("text-xs mt-1", message.sender.id === currentUser.id ? 'text-primary-foreground/70' : 'text-muted-foreground' )}>{message.timestamp}</p>
                        </div>
                    </div>
                ))}
            </div>
             <footer className="p-4 border-t-2 border-foreground">
                <form className="flex gap-4">
                    <Input placeholder="Type a message..." className="flex-1 border-2 border-foreground"/>
                    <NeoButton size="icon" type="submit">
                        <Send className="h-5 w-5"/>
                    </NeoButton>
                </form>
            </footer>
        </div>
    )
}


export default function MessagesPage() {
  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <div className="flex-1 flex flex-col">
        <MobileNav />
        <main className="flex-1 grid grid-cols-1 md:grid-cols-[350px_1fr] md:h-[calc(100vh-65px)]">
           <ConversationList />
           <MessageView />
        </main>
      </div>
    </div>
  );
}
