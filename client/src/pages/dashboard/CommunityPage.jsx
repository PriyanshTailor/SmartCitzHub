import { useEffect, useState, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Image as ImageIcon, Send, Heart, MessageSquare, MoreHorizontal, Loader2, X } from 'lucide-react'
import { communityApi } from '@/api/community.api'
import { getAuthUser } from '@/lib/auth'

export default function CommunityPage() {
  const [discussions, setDiscussions] = useState([])
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [posting, setPosting] = useState(false)

  // New Post State
  const [newPostContent, setNewPostContent] = useState('')
  const [newPostTitle, setNewPostTitle] = useState('')
  const [newPostImage, setNewPostImage] = useState(null)
  const fileInputRef = useRef(null)

  const user = getAuthUser()

  // Real-time polling
  useEffect(() => {
    fetchData() // Initial fetch

    const interval = setInterval(() => {
      // Silent refresh
      communityApi.getDiscussions().then(data => {
        if (data && data.length > 0) {
          setDiscussions(data)
        }
      }).catch(console.error)
    }, 5000) // Poll every 5 seconds

    return () => clearInterval(interval)
  }, [])

  const fetchData = async () => {
    try {
      const [data, membersData] = await Promise.all([
        communityApi.getDiscussions(),
        communityApi.getMembers()
      ])
      setDiscussions(data)
      setMembers(membersData)
    } catch (err) {
      console.error("Failed to load community data", err)
    } finally {
      setLoading(false)
    }
  }

  const handleImageSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      setNewPostImage(e.target.files[0])
    }
  }

  const handlePost = async () => {
    // Validation: Require at least one of title, content, or image
    if (!newPostTitle.trim() && !newPostContent.trim() && !newPostImage) {
      alert("Please add a title, some text, or a photo to post.")
      return
    }

    try {
      setPosting(true)
      const formData = new FormData()
      formData.append('title', newPostTitle)
      formData.append('content', newPostContent)
      if (newPostImage) {
        formData.append('image_file', newPostImage)
      }

      const res = await communityApi.createDiscussion(formData)

      if (res.success) {
        fetchData()
        resetForm()
      } else {
        alert("Failed to create post. Please try again.")
      }
    } catch (err) {
      console.error("Failed to post", err)
      alert("Error creating post")
    } finally {
      setPosting(false)
    }
  }

  const resetForm = () => {
    setNewPostTitle('')
    setNewPostContent('')
    setNewPostImage(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleLike = async (id) => {
    // Optimistic update
    setDiscussions(prev => prev.map(d => {
      if (d._id === id) {
        return { ...d, likes_count: d.is_liked ? d.likes_count - 1 : d.likes_count + 1, is_liked: !d.is_liked }
      }
      return d
    }))

    try {
      await communityApi.toggleLike(id)
    } catch (err) {
      console.error("Failed to like", err)
      fetchData() // Revert on error
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Community Hub</h1>
          <p className="text-muted-foreground">Connect with your neighbors in real-time.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Main Feed */}
        <div className="lg:col-span-2 space-y-6">

          {/* Create Post Widget */}
          <Card className="p-4 shadow-md bg-white dark:bg-card border-none">
            <div className="flex gap-4">
              <Avatar className="w-10 h-10">
                <AvatarImage src={user?.avatar_url} />
                <AvatarFallback>{user?.full_name?.charAt(0) || 'U'}</AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-3">
                <Input
                  placeholder="Topic Title (Optional)"
                  value={newPostTitle}
                  onChange={e => setNewPostTitle(e.target.value)}
                  className="font-semibold border-none shadow-none text-lg px-0 focus-visible:ring-0"
                />
                <Textarea
                  placeholder="What's happening?..."
                  value={newPostContent}
                  onChange={e => setNewPostContent(e.target.value)}
                  className="min-h-[80px] resize-none border-none shadow-none px-0 focus-visible:ring-0 text-base"
                />

                {newPostImage && (
                  <div className="relative inline-block mt-2">
                    <img src={URL.createObjectURL(newPostImage)} alt="Preview" className="h-40 w-auto rounded-lg object-cover border shadow-sm" />
                    <button onClick={() => setNewPostImage(null)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors">
                      <X size={14} />
                    </button>
                  </div>
                )}

                <div className="flex justify-between items-center pt-2 border-t mt-2">
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors" onClick={() => fileInputRef.current.click()}>
                      <ImageIcon className="w-5 h-5 mr-2" />
                      Photo
                    </Button>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageSelect} />
                  </div>
                  <Button onClick={handlePost} disabled={posting} className="rounded-full px-6">
                    {posting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                    Post
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {/* Feed */}
          <div className="space-y-6">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : discussions.length === 0 ? (
              <div className="text-center py-12 bg-muted/20 rounded-xl border border-dashed">
                <p className="text-muted-foreground">No discussions yet. Start the conversation!</p>
              </div>
            ) : (
              discussions.map(post => (
                <PostCard key={post._id} post={post} onLike={() => handleLike(post._id)} />
              ))
            )}
          </div>

        </div>

        {/* Sidebar */}
        <div className="space-y-6 hidden lg:block">
          <Card className="p-6 shadow-sm">
            <h3 className="font-semibold mb-4 text-lg">Community Stats</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Members</span>
                <span className="font-semibold">{members.length}+</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Discussions</span>
                <span className="font-semibold">{discussions.length}</span>
              </div>
            </div>
          </Card>

          <Card className="p-6 shadow-sm">
            <h3 className="font-semibold mb-4 text-lg">Active Members</h3>
            <div className="space-y-4">
              {members.slice(0, 5).map((member) => (
                <div key={member.id} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 text-primary flex items-center justify-center text-sm font-bold border border-primary/10">
                    {member.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{member.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{member.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

      </div>
    </div>
  )
}

import { moderationApi } from '@/api/moderation.api'
import { Flag } from 'lucide-react'

// ... inside PostCard component ...

function PostCard({ post, onLike }) {
  const [commentText, setCommentText] = useState('')
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState(post.comments || [])

  useEffect(() => {
    setComments(post.comments || [])
  }, [post.comments])

  const handleComment = async () => {
    if (!commentText.trim()) return

    try {
      const res = await communityApi.addComment(post._id, commentText)
      if (res.success) {
        setComments(prev => [...prev, res.comment])
        setCommentText('')
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleFlag = async () => {
    const reason = window.prompt("Why are you flagging this post?", "Inappropriate content")
    if (!reason) return

    try {
      await moderationApi.flagContent({
        contentId: post._id,
        contentType: 'Discussion',
        reason
      })
      alert("Post flagged for review.")
    } catch (error) {
      console.error("Failed to flag", error)
      alert("Failed to capture flag.")
    }
  }

  return (
    <Card className="shadow-sm overflow-hidden border-none hover:shadow-md transition-shadow duration-300">
      {/* Header */}
      <div className="p-5 pb-3 flex gap-4 justify-between">
        <div className="flex gap-4">
          <Avatar>
            <AvatarFallback className="bg-primary/10 text-primary">{post.author?.charAt(0) || '?'}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-sm">{post.author}</p>
            <p className="text-xs text-muted-foreground">{new Date(post.created_at).toLocaleString()}</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={handleFlag} title="Report Post">
          <Flag className="w-4 h-4 text-muted-foreground hover:text-red-500" />
        </Button>
      </div>

      {/* Content */}
      <div className="px-5 pb-3 space-y-3">
        {post.title && <h3 className="text-lg font-bold">{post.title}</h3>}
        {post.content && <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">{post.content}</p>}
      </div>

      {/* Image */}
      {post.image_url && (
        <div className="w-full bg-muted/20">
          <img src={post.image_url} alt="Post attachment" className="w-full max-h-[500px] object-cover" />
        </div>
      )}

      {/* Actions */}
      <div className="px-5 py-3 flex items-center gap-6 border-t bg-muted/5">
        <Button
          variant="ghost"
          size="sm"
          className={`gap-2 hover:bg-red-50 hover:text-red-500 transition-colors ${post.is_liked ? 'text-red-500' : 'text-muted-foreground'}`}
          onClick={onLike}
        >
          <Heart className={`w-5 h-5 ${post.is_liked ? 'fill-current' : ''}`} />
          <span className="font-medium">{post.likes_count}</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 text-muted-foreground hover:bg-blue-50 hover:text-blue-500 transition-colors"
          onClick={() => setShowComments(!showComments)}
        >
          <MessageSquare className="w-5 h-5" />
          <span className="font-medium">{comments.length}</span>
        </Button>
      </div>

      {/* Comment Section */}
      {(showComments || comments.length > 0) && (
        <div className="bg-muted/30 p-5 space-y-4 border-t">
          {comments.length > 0 && (
            <div className="space-y-4 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
              {comments.map((comment, idx) => (
                <div key={idx} className="flex gap-3 text-sm group">
                  <Avatar className="w-6 h-6 mt-1">
                    <AvatarFallback className="text-[10px]">{comment.author_name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 bg-white dark:bg-card p-3 rounded-2xl rounded-tl-none shadow-sm">
                    <div className="flex justify-between items-baseline mb-1">
                      <span className="font-semibold text-xs text-primary">{comment.author_name}</span>
                      <span className="text-[10px] text-muted-foreground">{new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-foreground">{comment.text}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <Input
              placeholder="Write a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="bg-background rounded-full px-4 border shadow-sm"
              onKeyDown={(e) => e.key === 'Enter' && handleComment()}
            />
            <Button size="icon" className="rounded-full shadow-sm" onClick={handleComment} disabled={!commentText.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </Card>
  )
}
