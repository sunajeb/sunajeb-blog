
export interface BlogPost {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
}

// Use localStorage to persist blog posts
const STORAGE_KEY = 'blogPosts';

// Sample blog posts for initial state
const sampleBlogPosts: BlogPost[] = [
  {
    id: '1',
    title: 'Getting Started with React',
    content: 'React is a popular JavaScript library for building user interfaces, particularly single-page applications. It\'s used for handling the view layer in web and mobile apps. React allows you to design simple views for each state in your application, and it will efficiently update and render just the right components when your data changes.\n\nReact was created by Jordan Walke, a software engineer at Facebook. It was first deployed on Facebook\'s News Feed in 2011 and later on Instagram in 2012. It was open-sourced at JSConf US in May 2013.\n\nReact\'s primary feature is the use of virtual DOM and a declarative programming style, which makes it easier to reason about your application and aims to be both efficient and flexible. It designs simple views for each state in your application, and React will efficiently update and render just the right components when your data changes.',
    createdAt: new Date('2023-01-15T12:00:00Z')
  },
  {
    id: '2',
    title: 'The Power of TypeScript',
    content: 'TypeScript is a programming language developed and maintained by Microsoft. It is a strict syntactical superset of JavaScript and adds optional static typing to the language. TypeScript is designed for the development of large applications and transcompiles to JavaScript.\n\nAs TypeScript is a superset of JavaScript, existing JavaScript programs are also valid TypeScript programs. TypeScript may be used to develop JavaScript applications for both client-side and server-side execution.\n\nTypeScript supports definition files that can contain type information of existing JavaScript libraries, much like C++ header files can describe the structure of existing object files. This enables other programs to use the values defined in the files as if they were statically typed TypeScript entities.',
    createdAt: new Date('2023-02-20T14:30:00Z')
  },
  {
    id: '3',
    title: 'Tailwind CSS: Utility-First CSS Framework',
    content: 'Tailwind CSS is a utility-first CSS framework for rapidly building custom user interfaces. It is a highly customizable, low-level CSS framework that gives you all of the building blocks you need to build bespoke designs without any annoying opinionated styles you have to fight to override.\n\nThe framework provides utility classes that can be composed to build any design, directly in your markup. Unlike other CSS frameworks like Bootstrap or Material UI, Tailwind doesn\'t provide pre-designed components. Instead, it offers utility classes that you can use to style your own components.\n\nTailwind CSS works by scanning your HTML, JavaScript components, and any other templates for class names, generating the corresponding styles, and then writing them to a static CSS file. It\'s fast, flexible, and reliable — with zero runtime.',
    createdAt: new Date('2023-03-10T09:15:00Z')
  }
];

// Initialize blog posts from localStorage or use sample data
const initializeBlogPosts = (): BlogPost[] => {
  const storedPosts = localStorage.getItem(STORAGE_KEY);
  if (storedPosts) {
    try {
      // Parse stored posts and convert string dates back to Date objects
      const parsed = JSON.parse(storedPosts);
      return parsed.map((post: any) => ({
        ...post,
        createdAt: new Date(post.createdAt)
      }));
    } catch (error) {
      console.error('Error parsing stored blog posts:', error);
      return [...sampleBlogPosts];
    }
  }
  return [...sampleBlogPosts];
};

// Save blog posts to localStorage
const saveBlogPosts = (posts: BlogPost[]): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
};

// Get all blog posts
export const getAllBlogPosts = (): BlogPost[] => {
  return initializeBlogPosts();
};

// Get a blog post by ID
export const getBlogPostById = (id: string): BlogPost | undefined => {
  const posts = getAllBlogPosts();
  return posts.find(post => post.id === id);
};

// Add a new blog post
export const addBlogPost = (title: string, content: string): BlogPost => {
  const posts = getAllBlogPosts();
  const newPost: BlogPost = {
    id: Date.now().toString(), // Simple ID generation
    title,
    content,
    createdAt: new Date()
  };
  
  const updatedPosts = [newPost, ...posts];
  saveBlogPosts(updatedPosts);
  return newPost;
};

// Update an existing blog post
export const updateBlogPost = (id: string, title: string, content: string): BlogPost | undefined => {
  const posts = getAllBlogPosts();
  const index = posts.findIndex(post => post.id === id);
  
  if (index !== -1) {
    const updatedPost: BlogPost = {
      ...posts[index],
      title,
      content
    };
    
    posts[index] = updatedPost;
    saveBlogPosts(posts);
    return updatedPost;
  }
  
  return undefined;
};

// Delete a blog post
export const deleteBlogPost = (id: string): boolean => {
  const posts = getAllBlogPosts();
  const filteredPosts = posts.filter(post => post.id !== id);
  
  if (filteredPosts.length < posts.length) {
    saveBlogPosts(filteredPosts);
    return true;
  }
  
  return false;
};
