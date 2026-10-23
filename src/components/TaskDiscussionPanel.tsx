import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { TaskComment, User as UserType } from '../types';
import {
  Send,
  AtSign,
  X,
  CheckCheck,
  CornerDownRight,
  Edit3,
  Trash2,
  Smile,
  MessageSquare,
  Sparkles,
  ArrowDown,
} from 'lucide-react';

interface TaskDiscussionPanelProps {
  taskId: string;
  taskTitle: string;
}

export const TaskDiscussionPanel: React.FC<TaskDiscussionPanelProps> = ({ taskId, taskTitle }) => {
  const {
    currentUser,
    users,
    getTaskComments,
    addComment,
    editComment,
    deleteComment,
  } = useApp();

  const comments = getTaskComments(taskId);
  // Sort chronologically (oldest first, newest at the bottom above input)
  const sortedComments = [...comments].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  const [inputText, setInputText] = useState('');
  const [replyingTo, setReplyingTo] = useState<TaskComment | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [showMentionMenu, setShowMentionMenu] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [showScrollBottomBtn, setShowScrollBottomBtn] = useState(false);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const isNearBottomRef = useRef(true);

  // Available users for mentions
  const availableUsers = useMemo(() => {
    const map = new Map<string, UserType>();
    (users || []).forEach((u) => {
      if (u && u.id) map.set(u.id, u);
    });
    if (currentUser && currentUser.id) {
      map.set(currentUser.id, currentUser);
    }
    return Array.from(map.values());
  }, [users, currentUser]);

  const scrollToBottom = (behavior: ScrollBehavior = 'auto') => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior,
      });
      setShowScrollBottomBtn(false);
      isNearBottomRef.current = true;
    }
  };

  // Auto-scroll to bottom immediately on mount and tab switch so user lands at latest messages without scrolling
  useEffect(() => {
    scrollToBottom('auto');
    const timer1 = setTimeout(() => scrollToBottom('auto'), 50);
    const timer2 = setTimeout(() => scrollToBottom('auto'), 200);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [taskId]);

  // When comments update or replying change, keep at bottom if previously near bottom
  useEffect(() => {
    if (isNearBottomRef.current) {
      scrollToBottom('smooth');
    }
  }, [comments.length, replyingTo]);

  const handleContainerScroll = () => {
    if (chatContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      const nearBottom = distanceFromBottom < 80;
      isNearBottomRef.current = nearBottom;
      setShowScrollBottomBtn(!nearBottom && comments.length > 2);
    }
  };

  // Handle typing to check for @ mentions
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInputText(val);

    const lastAtIdx = val.lastIndexOf('@');
    if (lastAtIdx !== -1 && lastAtIdx === val.length - 1) {
      setShowMentionMenu(true);
      setMentionQuery('');
    } else if (lastAtIdx !== -1 && lastAtIdx < val.length) {
      const query = val.slice(lastAtIdx + 1);
      if (!query.includes(' ') && query.length <= 20) {
        setShowMentionMenu(true);
        setMentionQuery(query.toLowerCase());
      } else {
        setShowMentionMenu(false);
      }
    } else {
      setShowMentionMenu(false);
    }
  };

  const handleSelectMention = (user: UserType) => {
    const lastAtIdx = inputText.lastIndexOf('@');
    let updated = '';
    if (lastAtIdx !== -1) {
      updated = inputText.substring(0, lastAtIdx) + `@${user.name} `;
    } else {
      updated = (inputText.length === 0 || inputText.endsWith(' ') ? inputText : inputText + ' ') + `@${user.name} `;
    }
    setInputText(updated);
    setShowMentionMenu(false);
    inputRef.current?.focus();
  };

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    addComment(taskId, inputText.trim(), replyingTo?.id);
    setInputText('');
    setReplyingTo(null);
    setShowMentionMenu(false);
    setTimeout(() => scrollToBottom('smooth'), 50);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const renderFormattedContent = (content: string) => {
    const words = (content || '').split(/(\s+)/);
    return words.map((word, idx) => {
      if (word.startsWith('@')) {
        const trailingMatch = word.match(/[,:;!?.]+$/);
        const trailingPunct = trailingMatch ? trailingMatch[0] : '';
        const rawMention = word.substring(1, word.length - trailingPunct.length);
        const clean = rawMention.toLowerCase();

        const matched = availableUsers.find((u) => {
          const fn = (u.name || '').toLowerCase();
          const first = (u.firstName || fn.split(' ')[0] || '').toLowerCase();
          const last = (u.lastName || fn.split(' ').slice(1).join(' ') || '').toLowerCase();
          return fn === clean || first === clean || last === clean || clean === 'all' || clean === 'team';
        });

        return (
          <React.Fragment key={idx}>
            <span className="inline-flex items-center font-bold text-[#005CBD] dark:text-blue-300 bg-blue-100/70 dark:bg-blue-900/60 px-1.5 py-0.5 rounded-md text-[11px] mx-0.5">
              @{matched ? matched.name : rawMention}
            </span>
            {trailingPunct}
          </React.Fragment>
        );
      }
      return <span key={idx}>{word}</span>;
    });
  };

  const filteredUsers = availableUsers.filter((u) => {
    if (!mentionQuery) return true;
    const q = mentionQuery.toLowerCase();
    return (
      (u.name || '').toLowerCase().includes(q) ||
      (u.firstName || '').toLowerCase().includes(q) ||
      (u.lastName || '').toLowerCase().includes(q) ||
      (u.title || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex flex-col flex-1 min-h-[460px] h-full max-h-full bg-[#efeae2]/30 dark:bg-[#0b141a] rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs relative">
      {/* WhatsApp Header Bar */}
      <div className="px-4 py-3 bg-[#f0f2f5] dark:bg-[#202c33] border-b border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#00a884] text-white flex items-center justify-center font-bold text-xs shadow-xs">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-xs text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
              <span>Task Discussion</span>
              <span className="text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-1.5 py-0.2 rounded-full">
                {comments.length}
              </span>
            </h4>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              Type <strong className="text-[#00a884] dark:text-[#25d366]">@</strong> to notify any team member
            </p>
          </div>
        </div>

        {/* Quick Member Tagging Pill Button */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowMentionMenu((prev) => !prev);
              setInputText((prev) => {
                if (prev.endsWith('@') || prev.endsWith('@ ')) return prev;
                return prev.length === 0 || prev.endsWith(' ') ? prev + '@' : prev + ' @';
              });
              inputRef.current?.focus();
            }}
            className="px-2.5 py-1 bg-white dark:bg-[#111b21] hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-[11px] font-semibold text-[#005CBD] dark:text-blue-400 flex items-center gap-1 transition-all shadow-2xs"
          >
            <AtSign className="w-3 h-3 text-[#00a884]" />
            <span>Tag Member</span>
          </button>
        </div>
      </div>

      {/* WhatsApp Chat View (Above Text Field) */}
      <div
        ref={chatContainerRef}
        onScroll={handleContainerScroll}
        className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3 relative select-text"
      >
        {/* Intro notice banner */}
        <div className="flex justify-center my-1">
          <div className="bg-[#ffeecd] dark:bg-[#182229] border border-[#ffdf9d] dark:border-slate-700/80 px-3 py-1 rounded-lg text-[10px] text-slate-700 dark:text-slate-300 shadow-2xs max-w-sm text-center">
            🔒 All comments and @mentions are logged in real-time and notified to assigned team members.
          </div>
        </div>

        {sortedComments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center p-6 text-slate-400 dark:text-slate-500 space-y-2">
            <div className="w-10 h-10 rounded-full bg-slate-200/60 dark:bg-slate-800 flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <p className="text-xs font-medium">No messages in this discussion yet.</p>
            <p className="text-[11px]">Send an update or tag a colleague below.</p>
          </div>
        ) : (
          sortedComments.map((comment) => {
            const isMe = comment.userId === currentUser?.id;
            const parentComment = comment.parentId
              ? comments.find((c) => c.id === comment.parentId)
              : null;
            const isAuthor = isMe || currentUser?.role === 'admin';

            return (
              <div
                key={comment.id}
                className={`flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                {/* Avatar for other people */}
                {!isMe && (
                  <img
                    src={
                      comment.userAvatar ||
                      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
                    }
                    alt={comment.userName}
                    className="w-6 h-6 rounded-full object-cover shrink-0 ring-1 ring-slate-200 dark:ring-slate-700 mb-0.5"
                  />
                )}

                {/* WhatsApp Chat Bubble */}
                <div
                  className={`relative group max-w-[85%] sm:max-w-[75%] rounded-2xl p-2.5 sm:p-3 text-xs shadow-xs transition-all ${
                    isMe
                      ? 'bg-[#d9fdd3] dark:bg-[#005c4b] text-slate-900 dark:text-slate-100 rounded-tr-xs border border-[#bbf7b8]/60 dark:border-[#005c4b]'
                      : 'bg-white dark:bg-[#202c33] text-slate-900 dark:text-slate-100 rounded-tl-xs border border-slate-100 dark:border-slate-700/60'
                  }`}
                >
                  {/* Sender Name if not me */}
                  {!isMe && (
                    <div className="font-bold text-[11px] text-[#00a884] dark:text-[#25d366] mb-1 flex items-center justify-between gap-2">
                      <span>{comment.userName}</span>
                    </div>
                  )}

                  {/* Quoted Message (WhatsApp Reply box) */}
                  {parentComment && (
                    <div
                      className={`mb-1.5 p-1.5 rounded-md border-l-4 text-[11px] truncate leading-tight ${
                        isMe
                          ? 'bg-black/5 dark:bg-black/20 border-[#00a884] text-slate-700 dark:text-slate-200'
                          : 'bg-slate-100 dark:bg-[#111b21] border-[#005CBD] text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <div className="font-bold text-[10px] text-[#00a884] dark:text-[#25d366]">
                        {parentComment.userName}
                      </div>
                      <div className="truncate opacity-90">{parentComment.content}</div>
                    </div>
                  )}

                  {/* Edit mode inline */}
                  {editingCommentId === comment.id ? (
                    <div className="space-y-2 mt-1">
                      <textarea
                        rows={2}
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                      />
                      <div className="flex justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setEditingCommentId(null)}
                          className="px-2 py-0.5 text-[10px] rounded border border-slate-300 dark:border-slate-600"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (!editingText.trim()) return;
                            editComment(taskId, comment.id, editingText.trim());
                            setEditingCommentId(null);
                          }}
                          className="px-2.5 py-0.5 text-[10px] bg-[#00a884] text-white rounded font-bold"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Message Body Content */
                    <div className="leading-relaxed whitespace-pre-wrap break-words">
                      {renderFormattedContent(comment.content)}
                    </div>
                  )}

                  {/* Footer: Timestamp, Edited badge & Checkmark icon */}
                  <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-slate-400 dark:text-slate-400 select-none">
                    {comment.edited && <span className="italic mr-0.5">(edited)</span>}
                    <span>
                      {new Date(comment.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    {isMe && <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" />}
                  </div>

                  {/* WhatsApp Quick Actions on Hover */}
                  <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xs px-1 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 shadow-2xs">
                    <button
                      type="button"
                      onClick={() => {
                        setReplyingTo(comment);
                        inputRef.current?.focus();
                      }}
                      className="p-1 hover:text-[#00a884] text-slate-500 dark:text-slate-400"
                      title="Reply"
                    >
                      <CornerDownRight className="w-3 h-3" />
                    </button>

                    {isAuthor && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCommentId(comment.id);
                            setEditingText(comment.content);
                          }}
                          className="p-1 hover:text-[#005CBD] text-slate-500 dark:text-slate-400"
                          title="Edit"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteComment(taskId, comment.id)}
                          className="p-1 hover:text-red-500 text-slate-500 dark:text-slate-400"
                          title="Delete"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Floating Mention Autocomplete Menu (Shown above input) */}
      {showMentionMenu && (
        <div className="bg-white dark:bg-[#202c33] border-t border-slate-200 dark:border-slate-700 p-2 max-h-40 overflow-y-auto z-20 shadow-lg">
          <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase px-2 py-1 flex items-center justify-between">
            <span>Select Member to Notify</span>
            <button
              type="button"
              onClick={() => setShowMentionMenu(false)}
              className="text-slate-400 hover:text-slate-700 dark:hover:text-white"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 mt-1">
            {filteredUsers.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => handleSelectMention(u)}
                className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-left text-xs transition-colors"
              >
                <img
                  src={
                    u.avatarUrl ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
                  }
                  alt={u.name}
                  className="w-5 h-5 rounded-full object-cover"
                />
                <div className="truncate">
                  <span className="font-bold text-slate-800 dark:text-slate-200">{u.name}</span>
                  <span className="text-[10px] text-slate-400 ml-1">({u.role})</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Replying-To Banner (Docked above input bar) */}
      {replyingTo && (
        <div className="bg-[#f0f2f5] dark:bg-[#182229] border-t border-slate-200 dark:border-slate-700 px-3 py-1.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-1 h-8 bg-[#00a884] rounded-full shrink-0" />
            <div className="truncate">
              <div className="font-bold text-[11px] text-[#00a884] dark:text-[#25d366]">
                Replying to {replyingTo.userName}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {replyingTo.content}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setReplyingTo(null)}
            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-full hover:bg-slate-200 dark:hover:bg-slate-800"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Jump to latest messages button when user has scrolled up */}
      {showScrollBottomBtn && (
        <button
          type="button"
          onClick={() => scrollToBottom('smooth')}
          className="absolute bottom-16 right-5 z-20 bg-white dark:bg-[#202c33] text-[#00a884] dark:text-[#25d366] border border-slate-200 dark:border-slate-700 shadow-md hover:shadow-lg rounded-full px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95"
        >
          <ArrowDown className="w-3.5 h-3.5" />
          <span>Latest messages</span>
        </button>
      )}

      {/* WhatsApp Input Field Down at the Bottom */}
      <form
        onSubmit={handleSendMessage}
        className="p-2.5 bg-[#f0f2f5] dark:bg-[#202c33] border-t border-slate-200/80 dark:border-slate-700/80 flex items-center gap-2 shrink-0"
      >
        {/* Tag @ button */}
        <button
          type="button"
          onClick={() => {
            setShowMentionMenu((prev) => !prev);
            setInputText((prev) => {
              if (prev.endsWith('@') || prev.endsWith('@ ')) return prev;
              return prev.length === 0 || prev.endsWith(' ') ? prev + '@' : prev + ' @';
            });
            inputRef.current?.focus();
          }}
          className="p-2 rounded-full text-slate-500 hover:text-[#00a884] dark:text-slate-400 dark:hover:text-[#25d366] hover:bg-slate-200/70 dark:hover:bg-slate-700/60 transition-colors shrink-0"
          title="Tag Team Member (@)"
        >
          <AtSign className="w-4 h-4" />
        </button>

        {/* Input Text Box */}
        <div className="flex-1 relative">
          <textarea
            ref={inputRef}
            rows={1}
            value={inputText}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message or @mention a member..."
            className="w-full px-4 py-2 bg-white dark:bg-[#2a3942] border border-slate-200 dark:border-slate-700 rounded-full text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#00a884] resize-none overflow-hidden max-h-24 shadow-2xs"
          />
        </div>

        {/* WhatsApp Circular Green Send Button */}
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="w-9 h-9 rounded-full bg-[#00a884] hover:bg-[#008f6f] disabled:opacity-40 text-white flex items-center justify-center shrink-0 shadow-sm transition-transform active:scale-95"
          title="Send Message (Enter)"
        >
          <Send className="w-4 h-4 ml-0.5" />
        </button>
      </form>
    </div>
  );
};
