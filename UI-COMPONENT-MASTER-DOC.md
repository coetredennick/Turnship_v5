# Turnship CRM UI Component Master Document

## Overview
This is a comprehensive catalog of all UI components in the Turnship CRM client-side codebase. The application is built with React, TypeScript, and Tailwind CSS, featuring a modern design system based on shadcn/ui components.

---

## 1. Main Application Components (`/client/src/components/`)

### 1.1 ActivityTimeline (`activity-timeline.tsx`)
**Purpose**: Displays a chronological timeline of user activities and system events
**Key Features**:
- Event type indicators with color coding (email: teal, reply: green, followup: amber, note: blue, profile: purple)
- Time formatting with relative timestamps ("just now", "2h ago", etc.)
- Loading states with skeleton UI
- Error handling with user-friendly messages
**Props**: None (uses `useTimeline` hook)
**Dependencies**: 
- `useTimeline` hook
- Tailwind CSS for styling
**Visual Style**: Clean timeline with colored dots and formatted text

### 1.2 AlumniGrid (`alumni-grid.tsx`)
**Purpose**: Grid layout for displaying alumni network connections
**Key Features**:
- Grid responsive layout (1 col mobile, 2 col tablet, 3 col desktop)
- Match score percentage display
- Recommended connections highlighting (teal theme)
- Avatar initials generation
- Connection reasons as badges
**Props Interface**:
```typescript
interface AlumniGridProps {
  alumni: AlumniMember[];
  onConnect: (alumniId: string) => void;
}
```
**Dependencies**: 
- Badge and Button UI components
- Tailwind for responsive grid
**Visual Style**: Card-based grid with teal accent for recommended connections

### 1.3 AnalyticsCharts (`analytics-charts.tsx`)
**Purpose**: Visualization components for analytics data
**Key Components**:
- `EmailActivityChart`: Bar chart showing email activity by day
- `StageFunnelChart`: Progress bars showing connection stage distribution  
- `PerformanceInsights`: Cards with key performance indicators
**Dependencies**:
- Recharts library for charts
- `useAnalytics` hook for data
- Custom color palette with 5 colors
**Visual Style**: Professional charts with gradient backgrounds and shadow effects

### 1.4 CompactKanban (`compact-kanban.tsx`)
**Purpose**: Compact kanban board for connection selection and stage visualization
**Key Features**:
- 4-stage system: "Not Started", "First Outreach", "Awaiting Reply", "Second Outreach"
- Multi-select functionality with checkboxes
- Status indicators (ready: green, draft_saved: yellow, waiting: blue, completed: gray)
- Responsive design with overflow scrolling
**Props Interface**:
```typescript
interface CompactKanbanProps {
  selectedConnections: string[];
  onSelectionChange: (connectionIds: string[]) => void;
}
```
**Dependencies**:
- `useConnections` hook
- `groupConnectionsByStage` utility
- Badge and Checkbox UI components

### 1.5 ConnectionCard (`connection-card.tsx`)
**Purpose**: Reusable card component for displaying individual connections
**Key Features**:
- Dynamic action buttons based on stage and status
- Status indicators with tooltips
- Stage progression logic
- Time-based follow-up recommendations (3+ days)
**Props Interface**:
```typescript
interface ConnectionCardProps {
  id?: string;
  name: string;
  role: string;
  company: string;
  timeAgo?: string;
  isAlumni?: boolean;
  stage?: string;
  stageStatus?: "ready" | "draft_saved" | "waiting" | "completed";
  lastContactedAt?: string;
  onAction?: (action: string, connectionId: string) => void;
  onClick?: () => void;
}
```
**Dependencies**:
- Multiple Lucide React icons
- Badge and Button UI components
**Visual Style**: Clean cards with hover effects and conditional styling

### 1.6 DraftBank (`draft-bank.tsx`)
**Purpose**: Comprehensive email draft management system
**Key Features**:
- Draft CRUD operations (Create, Read, Update, Delete)
- Search and filtering by status
- Tabbed interface (All/Drafts/Sent)
- Edit modal with form validation
- Batch operations support
**Props Interface**:
```typescript
interface DraftBankProps {
  selectedConnectionId?: string;
  onSendDraft?: (draftId: string) => void;
}
```
**Dependencies**:
- Multiple UI components (Card, Button, Badge, Input, Textarea, Tabs, AlertDialog)
- API integration for draft operations
**Visual Style**: Modern interface with card-based layout and color-coded status badges

### 1.7 EmailComposer (`email-composer.tsx`)
**Purpose**: AI-powered email composition interface
**Key Features**:
- Purpose-driven email generation (advice, internship, networking, custom)
- Real-time API integration for email generation
- Connection details display with context
- Regeneration capability
- Send functionality with stage updates
**Props Interface**:
```typescript
interface EmailComposerProps {
  selectedContacts?: string[];
}
```
**Dependencies**:
- `generateEmail`, `sendEmail` API functions
- `useConnections` hook
- Multiple UI components
**Visual Style**: Step-by-step interface with clear visual hierarchy

**NOTE**: Backup file exists (`email-composer.tsx.backup`) - contains older static implementation

### 1.8 KanbanBoard (`kanban-board.tsx`)
**Purpose**: Traditional kanban board layout (appears to be legacy/demo)
**Key Features**:
- 4-column layout: Prospected, First Outreach, Awaiting Reply, Warm
- Static mock data
- Color-coded columns
**Dependencies**: 
- ConnectionCard component
- Static data structure
**Visual Style**: Traditional kanban with colored background columns
**Note**: Contains hardcoded data, may be for demo purposes

### 1.9 Navigation (`navigation.tsx`)
**Purpose**: Main application navigation header
**Key Features**:
- 5 main navigation items (Dashboard, Connections, Alumni, Compose, Analytics)
- Responsive design with mobile considerations
- User dropdown menu with profile info
- Active route highlighting
**Dependencies**:
- Wouter for routing
- Avatar and DropdownMenu UI components
- Lucide React icons
**Visual Style**: Clean header with centered navigation and teal accent colors

### 1.10 Sidebar (`sidebar.tsx`)
**Purpose**: Collapsible sidebar for secondary navigation
**Key Features**:
- Hover-to-expand functionality (64px to 224px width)
- Logo display with smooth transitions
- Secondary navigation (FAQs, Contact, Mission Statement)
**Dependencies**:
- Button UI component
- Lucide React icons
**Visual Style**: Dark gradient background (slate-900 to slate-800) with smooth transitions

### 1.11 StatsCard (`stats-card.tsx`)
**Purpose**: Reusable metric display card
**Key Features**:
- Icon support with customizable background colors
- Change indicators (positive/negative/neutral)
- Flexible value display (string or number)
**Props Interface**:
```typescript
interface StatsCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  bgColor?: string;
}
```
**Visual Style**: Clean white cards with colored icon backgrounds

---

## 2. UI Components (`/client/src/components/ui/`)

The UI component library is based on shadcn/ui, featuring:

### Core Components:
- **Button** (`button.tsx`): Comprehensive button system with variants (default, destructive, outline, secondary, ghost, link) and sizes (sm, default, lg, icon)
- **Card** (`card.tsx`): Flexible card system with Header, Title, Description, Content, and Footer sub-components
- **Input** (`input.tsx`): Styled input fields with focus states and accessibility
- **Badge** (`badge.tsx`): Status and category indicators
- **Alert** (`alert.tsx`): System messages and notifications

### Form Components:
- **Checkbox** (`checkbox.tsx`): Styled checkboxes
- **Select** (`select.tsx`): Dropdown selection
- **Textarea** (`textarea.tsx`): Multi-line text input
- **Form** (`form.tsx`): Form structure and validation
- **Label** (`label.tsx`): Form labels
- **Radio Group** (`radio-group.tsx`): Radio button groups
- **Switch** (`switch.tsx`): Toggle switches
- **Slider** (`slider.tsx`): Range inputs

### Navigation Components:
- **Tabs** (`tabs.tsx`): Tabbed interfaces
- **Navigation Menu** (`navigation-menu.tsx`): Complex navigation structures
- **Breadcrumb** (`breadcrumb.tsx`): Hierarchical navigation
- **Pagination** (`pagination.tsx`): Page navigation
- **Menubar** (`menubar.tsx`): Menu bars

### Layout Components:
- **Sheet** (`sheet.tsx`): Side panels and drawers
- **Dialog** (`dialog.tsx`): Modal dialogs
- **Drawer** (`drawer.tsx`): Mobile-friendly drawers
- **Accordion** (`accordion.tsx`): Collapsible sections
- **Collapsible** (`collapsible.tsx`): Toggle visibility
- **Resizable** (`resizable.tsx`): Resizable panels
- **Separator** (`separator.tsx`): Visual dividers

### Data Display:
- **Table** (`table.tsx`): Data tables with Header, Body, Row, Cell sub-components
- **Avatar** (`avatar.tsx`): User profile images with fallbacks
- **Calendar** (`calendar.tsx`): Date selection
- **Chart** (`chart.tsx`): Chart utilities
- **Progress** (`progress.tsx`): Progress indicators
- **Skeleton** (`skeleton.tsx`): Loading states

### Interactive Components:
- **Command** (`command.tsx`): Command palette
- **Popover** (`popover.tsx`): Floating content
- **Tooltip** (`tooltip.tsx`): Hover information
- **Hover Card** (`hover-card.tsx`): Rich hover content
- **Context Menu** (`context-menu.tsx`): Right-click menus
- **Dropdown Menu** (`dropdown-menu.tsx`): Dropdown actions
- **Toggle** (`toggle.tsx`): Toggle buttons
- **Toggle Group** (`toggle-group.tsx`): Toggle button groups

### Utility Components:
- **Toast** (`toast.tsx`): Notification system
- **Toaster** (`toaster.tsx`): Toast container
- **Alert Dialog** (`alert-dialog.tsx`): Confirmation dialogs
- **Aspect Ratio** (`aspect-ratio.tsx`): Aspect ratio containers
- **Scroll Area** (`scroll-area.tsx`): Custom scrollbars
- **Input OTP** (`input-otp.tsx`): One-time password inputs
- **Carousel** (`carousel.tsx`): Image/content carousels

### Sidebar System:
- **Sidebar** (`ui/sidebar.tsx`): Complex sidebar component (different from main sidebar.tsx)

---

## 3. Custom Hooks (`/client/src/hooks/`)

### 3.1 useConnections (`useConnections.ts`)
**Purpose**: Manages connection data with API integration
**Returns**: `{ connections, loading, error, refetch }`
**Features**: Automatic error handling, loading states, manual refetch capability

### 3.2 useAnalytics (`useAnalytics.ts`)
**Purpose**: Analytics data management
**Interface**:
```typescript
interface AnalyticsData {
  sendsLast7: number;
  sendsLast28: number;
  followupsOnTime: number;
  stageFunnel: Record<string, number>;
}
```
**Returns**: `{ analytics, loading, error, refetch }`

### 3.3 useTimeline (`useTimeline.ts`)
**Purpose**: Activity timeline data management
**Interface**:
```typescript
interface TimelineEvent {
  id: string;
  type: "email" | "reply" | "followup" | "note" | "profile";
  title: string;
  description: string;
  timeAgo: string;
  color: string;
  at: string; // ISO timestamp
  connectionId?: string;
}
```

### 3.4 useToast (`use-toast.ts`)
**Purpose**: Toast notification system
**Features**: 
- Global state management
- Auto-dismiss functionality
- Update and dismiss controls
- Maximum 1 toast limit (configurable)
**⚠️ NAMING ISSUE**: Should be `useToast.ts` (camelCase)

### 3.5 useIsMobile (`use-mobile.tsx`)
**Purpose**: Responsive design hook
**Breakpoint**: 768px
**Returns**: Boolean indicating mobile state
**⚠️ NAMING ISSUES**: 
- Should be `useIsMobile.ts` (camelCase)
- Should be `.ts` extension (no JSX content)

---

## 4. Page Components (`/client/src/pages/`)

### 4.1 Dashboard (`dashboard.tsx`)
**Purpose**: Main application dashboard
**Layout Sections**:
- Stats cards (4 metrics: emails sent, reply rate, due follow-ups, active connections)
- Quick actions panel
- Recent activity timeline
- Due follow-ups list with priority indicators
**Dependencies**: StatsCard, ActivityTimeline, useAnalytics, useConnections
**Visual Style**: Grid-based layout with comprehensive CTA sections

### 4.2 Connections (`connections.tsx`)
**Purpose**: Connection management interface
**Key Features**:
- Dual view modes: Table and Alumni
- Advanced filtering (search, stage, company)
- Expandable connection details
- Bulk operations support
- Export/Import functionality
**Layout**: Responsive table with expandable rows and detailed filtering
**Dependencies**: Multiple UI components, useConnections hook

### 4.3 Compose (`compose.tsx`)
**Purpose**: Email composition center
**Features**:
- 3-tab interface: Single, Batch, Draft Bank
- Batch email generation with progress tracking
- Connection selection interface
- Results summary with error handling
**Dependencies**: EmailComposer, CompactKanban, DraftBank, useToast
**API Integration**: Batch email generation endpoint

### 4.4 Alumni (`alumni.tsx`)
**Purpose**: Alumni-specific networking interface
**Note**: File exists but implementation details need review

### 4.5 Analytics (`analytics.tsx`)
**Purpose**: Analytics and reporting dashboard
**Note**: File exists but implementation details need review

### 4.6 NotFound (`not-found.tsx`)
**Purpose**: 404 error page
**Note**: File exists but implementation details need review

---

## 5. Utility Files

### 5.1 connectionMapper (`/utils/connectionMapper.ts`)
**Purpose**: Data transformation utilities for connection objects
**Key Functions**:
- `mapConnectionToDisplayConnection()`: Transforms raw connection data to display format
- `groupConnectionsByStage()`: Groups connections by their current stage
**Interface**:
```typescript
interface DisplayConnection {
  id: string;
  name: string;
  role?: string;
  company?: string;
  email?: string;
  tags?: string[];
  alumni?: boolean;
  school?: string;
  grad_year?: number;
  stage?: string;
  stageStatus?: "ready" | "draft_saved" | "waiting" | "completed";
  currentDraftId?: string;
  lastContactedAt?: string;
  lastReplyAt?: string;
  replySentiment?: "positive" | "neutral" | "negative";
  timeAgo?: string;
  status?: "sent" | "replied" | "due" | "active";
}
```

---

## 6. Naming Conventions & Issues

### 6.1 ⚠️ Hook Naming Inconsistencies
**Current State**:
- ✅ `useConnections.ts` (camelCase, correct)
- ✅ `useAnalytics.ts` (camelCase, correct)
- ✅ `useTimeline.ts` (camelCase, correct)
- ❌ `use-toast.ts` (kebab-case, incorrect)
- ❌ `use-mobile.tsx` (kebab-case, incorrect extension)

**Required Actions**:
```bash
# Rename files to follow camelCase convention
mv src/hooks/use-toast.ts src/hooks/useToast.ts
mv src/hooks/use-mobile.tsx src/hooks/useIsMobile.ts
```

### 6.2 ⚠️ Backup Files
**Found**: 
- `email-composer.tsx.backup` - Should be removed if no longer needed

**Required Action**:
```bash
rm src/components/email-composer.tsx.backup
```

### 6.3 ✅ Component Naming
**Current Pattern**: PascalCase for all components (consistent and correct)
**File Extensions**: Appropriate use of `.tsx` for components and `.ts` for utilities

### 6.4 Stage System (Standardized)
**4-Stage System** used throughout:
1. "Not Started"
2. "First Outreach" 
3. "Awaiting Reply"
4. "Second Outreach"

**Status Values**: "ready" | "draft_saved" | "waiting" | "completed"

---

## 7. Technical Architecture

### 7.1 State Management
- **Local State**: React useState for component-specific state
- **Data Fetching**: Custom hooks with API integration
- **Global State**: Toast system with custom reducer pattern
- **Form State**: React Hook Form (where applicable)

### 7.2 Styling System
- **Framework**: Tailwind CSS
- **Component Library**: shadcn/ui (Radix UI primitives)
- **Design Tokens**: CSS variables for theming
- **Responsive**: Mobile-first approach with breakpoints
- **Color Palette**: Teal primary, with semantic colors

### 7.3 Dependencies
**Key External Libraries**:
- React + TypeScript
- Wouter (routing)
- Radix UI (component primitives)
- Lucide React (icons)
- Recharts (data visualization)
- class-variance-authority (component variants)
- TanStack Query (data fetching, where applicable)

---

## 8. Component Dependency Graph

```
Pages Layer:
├── Dashboard → StatsCard, ActivityTimeline, useAnalytics, useConnections
├── Connections → Table, Badge, Select, Input, useConnections
├── Compose → EmailComposer, CompactKanban, DraftBank, useToast
├── Alumni → AlumniGrid
└── Analytics → AnalyticsCharts, useAnalytics

Components Layer:
├── EmailComposer → useConnections, API functions
├── CompactKanban → useConnections, connectionMapper
├── DraftBank → Multiple UI components, API integration
├── ActivityTimeline → useTimeline
├── ConnectionCard → Badge, Button, Icons
└── AnalyticsCharts → useAnalytics, Recharts

Hooks Layer:
├── useConnections → API integration
├── useAnalytics → API integration  
├── useTimeline → API integration
├── useToast → Global state management (needs rename)
└── useIsMobile → Media query management (needs rename)

Utilities Layer:
└── connectionMapper → Data transformation
```

---

## 9. Quick Reference Tables

### 9.1 Component Sizes (Lines of Code)
| Component | Lines | Complexity | Notes |
|-----------|-------|------------|-------|
| DraftBank | 402 | High | Consider splitting |
| Connections | 338 | High | Consider splitting |
| Compose | 298 | Medium | Well organized |
| EmailComposer | 324 | Medium | Recently updated |

### 9.2 Stage Status Colors
| Status | Color | Usage |
|--------|-------|-------|
| ready | Green | Ready to proceed |
| draft_saved | Yellow | Has unsent draft |
| waiting | Blue | Awaiting reply/action |
| completed | Gray | Stage complete |

### 9.3 Common Props Patterns
| Pattern | Example | Usage |
|---------|---------|-------|
| onAction | `(action: string, id: string) => void` | Action callbacks |
| selectedItems | `string[]` | Multi-select state |
| loading | `boolean` | Loading states |
| error | `string \| null` | Error handling |

---

## 10. Development Guidelines

### 10.1 Adding New Components
1. Use PascalCase for component names
2. Place in appropriate directory (`/components/` vs `/components/ui/`)
3. Define clear TypeScript interfaces
4. Follow existing patterns for props and styling
5. Add to this master document

### 10.2 Styling Guidelines
- Use Tailwind CSS classes
- Follow mobile-first responsive design
- Use consistent color palette (teal primary)
- Implement proper hover and focus states
- Use semantic HTML elements

### 10.3 State Management Guidelines
- Use custom hooks for data fetching
- Keep component state local when possible
- Use TypeScript interfaces for all data structures
- Implement proper loading and error states

### 10.4 Testing Considerations
- Components are designed to be easily testable
- Clear separation of concerns
- Well-defined interfaces and props
- Mock-friendly API integration patterns

---

## 11. Next Steps & Maintenance

### 11.1 Immediate Actions Required
1. ✅ **Rename hooks** to camelCase convention
2. ✅ **Remove backup files** 
3. ✅ **Fix file extensions** (use-mobile.tsx → useIsMobile.ts)
4. 🔄 **Update import statements** in affected files

### 11.2 Future Improvements
- **Component Splitting**: Break down large components (DraftBank, Connections)
- **Performance**: Implement React.memo for expensive components
- **Accessibility**: Audit and improve ARIA attributes
- **Documentation**: Add JSDoc comments to complex components
- **Testing**: Add comprehensive test coverage

### 11.3 Monitoring
- Keep this document updated as components are added/modified
- Regular code reviews to maintain consistency
- Performance monitoring of large components
- User feedback integration for UX improvements

---

*Last Updated: August 11, 2025*
*Document Version: 1.0*