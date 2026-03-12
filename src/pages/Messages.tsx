import React, { useEffect, useState, useRef } from 'react';
import { Send, Paperclip, MoreVertical, Search, Phone, Video, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { formatDate } from '../lib/utils';
import { useSearchParams } from 'react-router-dom';

export const Messages = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const targetUserId = searchParams.get('user');
  
  const [contacts, setContacts] = useState<any[]>([]);
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const fetchContacts = async () => {
      if (!user) return;
      setLoading(true);
      try {
        // Fetch existing conversations
        const { data, error } = await supabase
          .from('messages')
          .select('sender_id, receiver_id, content, created_at, sender:profiles!messages_sender_id_fkey(id, full_name, avatar_url), receiver:profiles!messages_receiver_id_fkey(id, full_name, avatar_url)')
          .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
          .order('created_at', { ascending: false });

        if (error) throw error;

        const uniqueContactsMap = new Map();
        data?.forEach((msg: any) => {
          const otherUser = msg.sender_id === user.id ? msg.receiver : msg.sender;
          if (otherUser && !uniqueContactsMap.has(otherUser.id)) {
            uniqueContactsMap.set(otherUser.id, {
              ...otherUser,
              lastMsg: msg.content,
              time: formatDate(msg.created_at),
            });
          }
        });

        let contactsList = Array.from(uniqueContactsMap.values());

        // If a target user is specified, ensure they are in the contacts list
        if (targetUserId && targetUserId !== user.id && !uniqueContactsMap.has(targetUserId)) {
          const { data: targetProfile, error: profileError } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url')
            .eq('id', targetUserId)
            .single();
          
          if (!profileError && targetProfile) {
            const newContact = {
              ...targetProfile,
              lastMsg: 'Nouvelle discussion',
              time: 'Maintenant'
            };
            contactsList = [newContact, ...contactsList];
            setSelectedContact(newContact);
          }
        } else if (targetUserId && uniqueContactsMap.has(targetUserId)) {
          setSelectedContact(uniqueContactsMap.get(targetUserId));
        } else if (contactsList.length > 0 && !selectedContact) {
          setSelectedContact(contactsList[0]);
        }

        setContacts(contactsList);
      } catch (err) {
        console.error('Error fetching contacts:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchContacts();
  }, [user, targetUserId]);

  useEffect(() => {
    if (!user || !selectedContact) return;

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${selectedContact.id}),and(sender_id.eq.${selectedContact.id},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
      } else {
        setMessages(data || []);
      }
    };

    fetchMessages();

    // Real-time subscription
    const subscription = supabase
      .channel('public:messages')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages'
      }, (payload) => {
        const newMsg = payload.new;
        // Only add message if it belongs to the current conversation
        if (
          (newMsg.sender_id === user.id && newMsg.receiver_id === selectedContact.id) ||
          (newMsg.sender_id === selectedContact.id && newMsg.receiver_id === user.id)
        ) {
          setMessages((prev) => {
            // Avoid duplicates
            if (prev.some(m => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [user, selectedContact]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedContact || (!newMessage.trim() && !sending) || sending) return;

    const content = newMessage.trim();
    if (!content && !sending) return;

    setSending(true);
    try {
      const { error } = await supabase
        .from('messages')
        .insert([
          {
            sender_id: user.id,
            receiver_id: selectedContact.id,
            content: content || 'Fichier envoyé',
          },
        ]);

      if (error) throw error;
      setNewMessage('');
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setSending(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !selectedContact) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from('chat-attachments')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('chat-attachments')
        .getPublicUrl(filePath);

      const { error: msgError } = await supabase
        .from('messages')
        .insert([
          {
            sender_id: user.id,
            receiver_id: selectedContact.id,
            content: `Fichier: ${file.name}`,
            file_url: publicUrl,
          },
        ]);

      if (msgError) throw msgError;
    } catch (err: any) {
      console.error('Error uploading file:', err);
      // If bucket doesn't exist, we might need to inform the user or try another way
      // For now, we'll just toast an error
      alert("Erreur lors de l'envoi du fichier. Assurez-vous que le stockage est configuré.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (loading && contacts.length === 0) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex h-[600px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* Sidebar: Contacts */}
        <aside className="hidden w-80 flex-col border-r border-slate-100 md:flex">
          <div className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher une discussion..."
                className="h-9 w-full rounded-lg border-none bg-slate-50 pl-10 pr-4 text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {contacts.length > 0 ? (
              contacts.map((contact) => (
                <button 
                  key={contact.id} 
                  onClick={() => setSelectedContact(contact)}
                  className={`flex w-full items-center gap-3 px-4 py-3 transition-colors ${
                    selectedContact?.id === contact.id ? 'bg-slate-50' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="relative">
                    <div className="h-12 w-12 rounded-full bg-slate-200 overflow-hidden">
                      <img src={contact.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${contact.full_name}`} alt={contact.full_name} />
                    </div>
                  </div>
                  <div className="flex-1 text-left">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-slate-900">{contact.full_name}</p>
                      <span className="text-[10px] text-slate-400">{contact.time}</span>
                    </div>
                    <p className="line-clamp-1 text-xs text-slate-500">{contact.lastMsg}</p>
                  </div>
                </button>
              ))
            ) : (
              <div className="p-8 text-center text-slate-500 text-sm">
                Aucune discussion.
              </div>
            )}
          </div>
        </aside>

        {/* Main: Chat Window */}
        <main className="flex flex-1 flex-col">
          {selectedContact ? (
            <>
              {/* Header */}
              <header className="flex items-center justify-between border-b border-slate-100 px-6 py-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-slate-200 overflow-hidden">
                    <img src={selectedContact.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedContact.full_name}`} alt="Contact" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{selectedContact.full_name}</p>
                    <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">En ligne</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-full">
                    <MoreVertical className="h-4 w-4 text-slate-400" />
                  </Button>
                </div>
              </header>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto bg-slate-50 p-6 space-y-4">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
                      msg.sender_id === user?.id ? 'bg-emerald-600 text-white rounded-tr-none' : 'bg-white text-slate-900 rounded-tl-none'
                    }`}>
                      {msg.file_url ? (
                        <div className="space-y-2">
                          {msg.file_url.match(/\.(mp4|webm|ogg|mov)$/i) ? (
                            <video src={msg.file_url} controls className="max-w-full rounded-lg" />
                          ) : msg.file_url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                            <img src={msg.file_url} alt="Attachment" className="max-w-full rounded-lg" />
                          ) : (
                            <a href={msg.file_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 underline">
                              <Paperclip className="h-4 w-4" />
                              {msg.content || 'Voir le fichier'}
                            </a>
                          )}
                        </div>
                      ) : (
                        <p>{msg.content}</p>
                      )}
                      <p className={`mt-1 text-[10px] ${msg.sender_id === user?.id ? 'text-emerald-100' : 'text-slate-400'}`}>
                        {formatDate(msg.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <footer className="border-t border-slate-100 p-4">
                <form onSubmit={handleSendMessage} className="flex items-center gap-2 rounded-xl bg-slate-50 p-2">
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    onChange={handleFileUpload}
                    accept="image/*,video/*,.pdf,.doc,.docx,.zip"
                  />
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    className="h-9 w-9 p-0 rounded-full"
                    onClick={() => fileInputRef.current?.click()}
                    isLoading={uploading}
                  >
                    <Paperclip className="h-4 w-4 text-slate-400" />
                  </Button>
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Écrivez votre message..."
                    className="flex-1 border-none bg-transparent px-2 text-sm focus:ring-0"
                  />
                  <Button type="submit" size="sm" className="h-9 w-9 p-0 rounded-full" isLoading={sending}>
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </footer>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center bg-slate-50 text-slate-500">
              Sélectionnez une discussion pour commencer.
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
