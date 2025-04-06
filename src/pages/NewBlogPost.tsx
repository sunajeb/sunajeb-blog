
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { addBlogPost } from '../services/blogService';
import { useToast } from '@/components/ui/use-toast';

const NewBlogPost = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !content.trim()) {
      toast({
        title: "Validation Error",
        description: "Title and content are required.",
        variant: "destructive",
      });
      return;
    }
    
    const newPost = addBlogPost(title, content);
    toast({
      title: "Post created",
      description: "Your blog post has been published successfully.",
    });
    navigate(`/post/${newPost.id}`);
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Write New Post</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              placeholder="Enter post title"
            />
          </div>
          
          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
              Content
            </label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={15}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              placeholder="Write your post content here..."
            />
            <p className="mt-1 text-sm text-gray-500">
              Use a blank line between paragraphs for proper formatting.
            </p>
          </div>
          
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors"
            >
              Publish
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default NewBlogPost;
