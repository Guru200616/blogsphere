import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { User, Blog, Comment, UserRole } from '../../src/types';

const FALLBACK_DB_PATH = path.join(process.cwd(), 'db_fallback.json');

// Real MongoDB connect helper (initialized lazily when requested, if MONGODB_URI exists)
let isConnectedToMongo = false;

export async function connectDB() {
  const mongoUri = process.env.MONGODB_URI;
  if (mongoUri) {
    try {
      if (mongoose.connection.readyState === 0) {
        await mongoose.connect(mongoUri);
        isConnectedToMongo = true;
        console.log('Successfully connected to MongoDB via Atlas.');
      }
    } catch (err) {
      console.error('Failed to connect to MongoDB URI. Falling back to JSON database.', err);
      isConnectedToMongo = false;
    }
  } else {
    console.log('No MONGODB_URI found. Utilizing high-performance JSON database fallback at:', FALLBACK_DB_PATH);
  }
}

// Initial Seed Data Creator
function getInitialSeedData() {
  const salt = bcrypt.genSaltSync(10);
  const hashedPassAdmin = bcrypt.hashSync('admin123', salt);
  const hashedPassAuthor = bcrypt.hashSync('author123', salt);
  const hashedPassReader = bcrypt.hashSync('reader123', salt);

  const users = [
    {
      id: 'usr_admin',
      name: 'Eleanor Vance',
      username: 'eleanor_vance',
      email: 'admin@blog.com',
      password: hashedPassAdmin,
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
      bio: 'Executive Editor and Admin at BlogSphere. Writes about design philosophy, ethics in tech, and editorial guidelines.',
      role: 'Admin' as UserRole,
      followers: ['usr_reader'],
      following: ['usr_author'],
      socialLinks: {
        twitter: 'https://twitter.com/eleanor_vance',
        github: 'https://github.com/eleanorv',
        website: 'https://eleanorvance.com'
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'usr_author',
      name: 'Marcus Chen',
      username: 'marcus_codes',
      email: 'author@blog.com',
      password: hashedPassAuthor,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
      bio: 'Senior Software Engineer & Tech Advocate. Passionate about developer tools, TypeScript, and functional programming.',
      role: 'Author' as UserRole,
      followers: ['usr_admin', 'usr_reader'],
      following: [],
      socialLinks: {
        twitter: 'https://twitter.com/marcus_codes',
        github: 'https://github.com/marcuschen',
        website: 'https://marcuscodes.dev'
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'usr_reader',
      name: 'Sofia Rodriguez',
      username: 'sofia_reads',
      email: 'reader@blog.com',
      password: hashedPassReader,
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80',
      bio: 'Tech enthusiast, product design lover, and voracious reader. Always looking for clean solutions and solid architecture.',
      role: 'Reader' as UserRole,
      followers: [],
      following: ['usr_admin', 'usr_author'],
      socialLinks: {
        twitter: 'https://twitter.com/sofia_reads'
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  const blogs = [
    {
      id: 'blog_1',
      title: 'The Future of Web Interfaces: Minimalism, Glassmorphism, and Playful Interaction',
      slug: 'future-of-web-interfaces',
      excerpt: 'How modern UI design language is transitioning from cold, clinical boxes to layered, tactually responsive environments utilizing transparency, blur, and motion.',
      content: `<h1>The Return of Tactility</h1><p>For the past decade, web interfaces have been governed by flat, sterile, and clinical designs. We flattened our buttons, removed our borders, and cast away gradients. But interfaces are tactile by nature; they are a digital extension of our hands. Recently, a beautiful evolution has emerged—one that blends lightweight glass layers, depth, and fluid animations to produce interfaces that react to user inputs with real physics.</p><h2>Understanding Glassmorphism</h2><p>At its core, Glassmorphism is styled using three pillars:</p><ul><li><b>Multi-layered hierarchy:</b> Objects appear on separate, floating planes.</li><li><b>Backdrop-filter blur:</b> Deeply blurring behind container panes creates an organic focus.</li><li><b>Vibrant lighting:</b> Subtle borders (1px wide) mimicking physical light refractions.</li></ul><p>For example, using Tailwind CSS, a gorgeous card can be established with backdrop-blur and a semi-transparent border:</p><pre><code>className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6"</code></pre><p>This design makes the workspace feel alive, mirroring the complexity of real frosted glass while keeping elements highly legible.</p><blockquote>"Great design behaves like water; it conforms perfectly to its environment while maintaining its beautiful density."</blockquote><h2>The Role of Purposeful Motion</h2><p>Animations should never be decorative. They must reinforce spatial mental models. A card expanding when click-triggered should arise directly from its source coordinates. Buttons should respond to hover with a subtle, magnet-like attraction. This is why tools like Framer Motion are so powerful: they calculate physical velocity and springs rather than raw timers, making interactions feel physical and premium.</p><p>As designers and engineers, we must keep pushing these boundaries. The future of the web is organic, tactile, and highly responsive. We are no longer clicking flat pages; we are navigating interactive physical spaces.</p>`,
      coverImage: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1200&q=85',
      tags: ['Design', 'UI/UX', 'CSS', 'Tailwind'],
      category: 'Lifestyle',
      author: users[0], // Eleanor Vance
      status: 'Published' as const,
      views: 1250,
      likes: ['usr_author', 'usr_reader'],
      bookmarks: ['usr_reader'],
      readingTime: 3,
      createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString()
    },
    {
      id: 'blog_2',
      title: 'Mastering TypeScript 5.x: Advanced Types and Architectural Best Practices',
      slug: 'mastering-typescript-5-advanced-types',
      excerpt: 'Deep dive into advanced TypeScript patterns, including template literal types, satisfies operator, utility interfaces, and building robust clean architectures.',
      content: `<h1>Typing Beyond the Basics</h1><p>TypeScript is much more than a compiler; it is an active development partner. In modern enterprise applications, developers often treat TypeScript as simple boilerplate verification instead of utilizing its real expressive capabilities. Today, we will explore advanced features that unlock flexible, bulletproof typing.</p><h2>The Power of the <code>satisfies</code> Operator</h2><p>Introduced in TypeScript 4.9 and improved in 5.x, the satisfies operator allows us to validate that an expression matches a type, without forcing the compiler to widen or discard its precise literal type. Consider this config setup:</p><pre><code>type Connection = string | { host: string; port: number };\nconst config = {\n  db: "mongodb://localhost:27017",\n  cache: { host: "127.0.0.1", port: 6379 }\n} satisfies Record&lt;string, Connection&gt;;</code></pre><p>With satisfies, TypeScript knows <code>config.db</code> is specifically a string literal, allowing you to use string methods (like <code>.split()</code>) directly without manual type assertions. This is extremely powerful for static configuration files!</p><h2>Template Literal Types</h2><p>Template literal types allow us to manipulate and enforce string formats natively. For example, validating CSS color strings or routing path formats in a custom Express wrapper:</p><pre><code>type RoutePath = \`/api/\${string}\`;\nfunction registerRoute(path: RoutePath) { ... }</code></pre><p>Any path not starting with <code>/api/</code> will trigger a compiler error on the spot. This guarantees that your team adheres strictly to uniform routes across your codebase!</p><h2>Conclusion</h2><p>TypeScript should serve to amplify your velocity, not reduce it. By utilizing satisfying guards and template literal enforcements, you catch errors at compile-time that would otherwise require dozens of unit tests.</p>`,
      coverImage: 'https://images.unsplash.com/photo-1516116211223-5c359a36298a?auto=format&fit=crop&w=1200&q=85',
      tags: ['TypeScript', 'Programming', 'NodeJS', 'WebDev'],
      category: 'Programming',
      author: users[1], // Marcus Chen
      status: 'Published' as const,
      views: 940,
      likes: ['usr_admin'],
      bookmarks: [],
      readingTime: 4,
      createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString()
    },
    {
      id: 'blog_3',
      title: 'A Freelancer’s Blueprint: Scaling from $1k to $10k+ Monthly Projects',
      slug: 'freelance-scaling-blueprint',
      excerpt: 'A practical, battle-tested action plan focusing on positioning, value-based pricing, Client onboarding CRM, and executing premium corporate deliverables.',
      content: `<h1>Trading Hours for Value</h1><p>Most freelancers get trapped in what is known as the "tactical hamster wheel." They sell hourly contracts, compete on cheap job boards, and treat client relationships as short-term transactional tickets. To break through the ceiling and secure premium $10,000+ project engagements, you must shift your entire operating model from a commodity supplier to a trusted business adviser.</p><h2>Stop Selling Web Pages; Sell Business Outcomes</h2><p>A client does not care about your stack. They do not care if you write React, Svelte, or vanilla HTML. What they care about is their business conversion metrics, user acquisition costs, and customer retention ratios.</p><p>Compare these two pitches:</p><ul><li><b>Pitch A:</b> "I will build a React website with 5 pages and a contact form for $2,000."</li><li><b>Pitch B:</b> "I am building an automated customer capture funnel. By redesigning your mobile interface and optimizing your landing page pageweight, we can increase checkout conversions by an estimated 15%, translating to roughly $12,000 in monthly incremental recurring revenue."</li></ul><p>Pitch B shifts the conversation entirely to investment ROI. It justifies a premium project fee because the financial outcome easily covers the development cost.</p><h2>Establishing Professional Workflows</h2><p>When charging premium fees, your operations must be highly polished. This means providing clients with:</p><ul><li>Interactive Figma design wireframes before writing code.</li><li>Real-time progress trackers (like Notion or Trello) to keep milestones obvious.</li><li>Comprehensive documentation and handoffs to minimize support latency.</li></ul><p>When you conduct yourself like an agency, clients treat you like an agency, opening the door to large retainer relationships and corporate consulting agreements.</p>`,
      coverImage: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=85',
      tags: ['Business', 'Freelance', 'Marketing'],
      category: 'Business',
      author: users[1], // Marcus Chen
      status: 'Published' as const,
      views: 730,
      likes: ['usr_admin', 'usr_reader'],
      bookmarks: ['usr_admin'],
      readingTime: 5,
      createdAt: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString()
    }
  ];

  const comments = [
    {
      id: 'comm_1',
      blogId: 'blog_1',
      userId: 'usr_author',
      user: {
        id: 'usr_author',
        name: 'Marcus Chen',
        username: 'marcus_codes',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
        role: 'Author' as UserRole
      },
      comment: 'An absolute masterpiece of a read, Eleanor! The explanation ofbackdrop-blur and lighting refracts matches exactly what we see in physical space. I would love to see how this translates to rendering performance on hand-held mobile devices.',
      parentCommentId: null,
      likes: ['usr_reader'],
      createdAt: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString()
    },
    {
      id: 'comm_2',
      blogId: 'blog_1',
      userId: 'usr_admin',
      user: {
        id: 'usr_admin',
        name: 'Eleanor Vance',
        username: 'eleanor_vance',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
        role: 'Admin' as UserRole
      },
      comment: 'Thank you for the kind feedback, Marcus! Regarding mobile performance, utilizing hardware-accelerated transforms and avoiding nesting too many filter layers is crucial. Keep backdrops isolated to the topmost overlays.',
      parentCommentId: 'comm_1',
      likes: [],
      createdAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString()
    },
    {
      id: 'comm_3',
      blogId: 'blog_1',
      userId: 'usr_reader',
      user: {
        id: 'usr_reader',
        name: 'Sofia Rodriguez',
        username: 'sofia_reads',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80',
        role: 'Reader' as UserRole
      },
      comment: 'Incredible guide, I will definitely implement glass cards on my new personal project!',
      parentCommentId: null,
      likes: ['usr_admin', 'usr_author'],
      createdAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString()
    }
  ];

  return { users, blogs, comments };
}

// Memory database loaded initially
let memoryDB = {
  users: [] as any[],
  blogs: [] as any[],
  comments: [] as any[]
};

// Ensure path existence and load file DB
function loadFallbackDB() {
  if (fs.existsSync(FALLBACK_DB_PATH)) {
    try {
      const data = fs.readFileSync(FALLBACK_DB_PATH, 'utf-8');
      memoryDB = JSON.parse(data);
    } catch (err) {
      console.error('Error reading fallback DB, re-seeding...', err);
      memoryDB = getInitialSeedData();
      saveFallbackDB();
    }
  } else {
    memoryDB = getInitialSeedData();
    saveFallbackDB();
  }
}

function saveFallbackDB() {
  try {
    fs.mkdirSync(path.dirname(FALLBACK_DB_PATH), { recursive: true });
    fs.writeFileSync(FALLBACK_DB_PATH, JSON.stringify(memoryDB, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing to fallback DB:', err);
  }
}

// Run load on load
loadFallbackDB();

// Unified Model Adaptability Layer
export const DB = {
  // USERS
  users: {
    async find() {
      return memoryDB.users;
    },
    async findOne(query: { id?: string; email?: string; username?: string }) {
      return memoryDB.users.find(u => {
        if (query.id && u.id === query.id) return true;
        if (query.email && u.email.toLowerCase() === query.email.toLowerCase()) return true;
        if (query.username && u.username.toLowerCase() === query.username.toLowerCase()) return true;
        return false;
      }) || null;
    },
    async create(user: any) {
      const newUser = {
        ...user,
        id: user.id || 'usr_' + Math.random().toString(36).substring(2, 11),
        followers: user.followers || [],
        following: user.following || [],
        avatar: user.avatar || `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80`,
        bio: user.bio || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      memoryDB.users.push(newUser);
      saveFallbackDB();
      return newUser;
    },
    async update(id: string, updates: any) {
      const index = memoryDB.users.findIndex(u => u.id === id);
      if (index === -1) return null;
      memoryDB.users[index] = {
        ...memoryDB.users[index],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      
      // Update nested author profiles inside blogs too
      memoryDB.blogs.forEach((b: any, bIndex: number) => {
        if (b.author.id === id) {
          memoryDB.blogs[bIndex].author = {
            ...memoryDB.blogs[bIndex].author,
            ...updates
          };
        }
      });

      saveFallbackDB();
      return memoryDB.users[index];
    },
    async delete(id: string) {
      memoryDB.users = memoryDB.users.filter(u => u.id !== id);
      saveFallbackDB();
      return true;
    }
  },

  // BLOGS
  blogs: {
    async find(filter: { category?: string; status?: BlogStatus; tag?: string; search?: string } = {}) {
      let result = [...memoryDB.blogs];
      if (filter.status) {
        result = result.filter(b => b.status === filter.status);
      }
      if (filter.category) {
        result = result.filter(b => b.category.toLowerCase() === filter.category!.toLowerCase());
      }
      if (filter.tag) {
        result = result.filter(b => b.tags.some(t => t.toLowerCase() === filter.tag!.toLowerCase()));
      }
      if (filter.search) {
        const queryStr = filter.search.toLowerCase();
        result = result.filter(b => 
          b.title.toLowerCase().includes(queryStr) || 
          b.excerpt.toLowerCase().includes(queryStr) ||
          b.content.toLowerCase().includes(queryStr) ||
          b.tags.some(t => t.toLowerCase().includes(queryStr)) ||
          b.author.name.toLowerCase().includes(queryStr)
        );
      }
      return result;
    },
    async findOne(query: { id?: string; slug?: string }) {
      const blog = memoryDB.blogs.find(b => {
        if (query.id && b.id === query.id) return true;
        if (query.slug && b.slug === query.slug) return true;
        return false;
      });
      return blog || null;
    },
    async create(blog: any) {
      const newBlog = {
        ...blog,
        id: 'blog_' + Math.random().toString(36).substring(2, 11),
        views: 0,
        likes: [],
        bookmarks: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      memoryDB.blogs.push(newBlog);
      saveFallbackDB();
      return newBlog;
    },
    async update(id: string, updates: any) {
      const index = memoryDB.blogs.findIndex(b => b.id === id);
      if (index === -1) return null;
      memoryDB.blogs[index] = {
        ...memoryDB.blogs[index],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      saveFallbackDB();
      return memoryDB.blogs[index];
    },
    async delete(id: string) {
      memoryDB.blogs = memoryDB.blogs.filter(b => b.id !== id);
      // Clean up comments associated with this blog too
      memoryDB.comments = memoryDB.comments.filter(c => c.blogId !== id);
      saveFallbackDB();
      return true;
    }
  },

  // COMMENTS
  comments: {
    async findByBlog(blogId: string) {
      return memoryDB.comments.filter(c => c.blogId === blogId);
    },
    async findOne(id: string) {
      return memoryDB.comments.find(c => c.id === id) || null;
    },
    async find() {
      return memoryDB.comments;
    },
    async create(comment: any) {
      const newComment = {
        ...comment,
        id: 'comm_' + Math.random().toString(36).substring(2, 11),
        likes: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      memoryDB.comments.push(newComment);
      saveFallbackDB();
      return newComment;
    },
    async update(id: string, updates: any) {
      const index = memoryDB.comments.findIndex(c => c.id === id);
      if (index === -1) return null;
      memoryDB.comments[index] = {
        ...memoryDB.comments[index],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      saveFallbackDB();
      return memoryDB.comments[index];
    },
    async delete(id: string) {
      // Also delete nested replies recursively to make it extremely clean!
      const deleteRecursive = (commentId: string) => {
        const children = memoryDB.comments.filter(c => c.parentCommentId === commentId);
        children.forEach(child => deleteRecursive(child.id));
        memoryDB.comments = memoryDB.comments.filter(c => c.id !== commentId);
      };
      deleteRecursive(id);
      saveFallbackDB();
      return true;
    }
  }
};
