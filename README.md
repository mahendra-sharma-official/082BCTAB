# Class Portal

A digital workspace and portal designed specifically for the BCT (Computer Engineering) batch of students. Featuring profiles with sandboxed custom HTML/CSS showcases, a timeline-based project directory, upcoming events board, real-time 1:1 student chat, and a Hacker News-style project explore feed.
---

## 🎨 Design System & Philosophy

- **Vibe**: Warm, classic, modern. Structured like an elegant digital directory or yearbook.
- **Palette**:
  - Primary Accent: Warm Gold/Yellow (`#F4C430`)
  - Typography / Ink: Black (`#111111`)
  - Background: Pure White (`#FFFFFF`)
  - Secondary / Borders: Muted Greys (`#8A8A8A`, `#E5E5E5`)
- **Typography**: Uses `"Times New Roman", Times, serif` as the primary font for an authentic, structured look. Pair with minimal, clean sans-serif styles strictly for UI action labels.
- **Rules**: Zero gradients. Flat panels, crisp 1px borders, and ultra-sharp layouts with corner radii kept strictly between `0px` and `4px`.

---

## 🔐 Authentication, Authorization, & Security

### 1. Email Patterns & Authorization
Only verified students under the department domain pattern can register:
- **Format**: `{batchYear}bct{rollNumber:3digits}.{name}@pcampus.edu.np`
- **Roll limit**: Only roll numbers `001–048` are allowed access.
- **Exception Emails**: Admins can approve non-matching email addresses (e.g., instructors, advisors) by writing to `/exceptionEmails/{email}` in Firestore.

### 2. Role Hierarchy
- **Admin**: Has complete control to assign/revoke other admin/moderator/CR roles and manage the Exception Emails list.
- **Moderator**: Access to custom roles and configurable moderation.
- **CR / Locus CR**: Authorized to create, edit, and delete events.
- **Student**: Default user state. Can post projects, customize their profile/showcase, star others' projects, and chat 1:1.

### 3. Root Admin Seeding
The user `082bct013.apil@pcampus.edu.np` is configured as the **system root admin**.
- Upon first login or profile registration, if the user's email is exactly `082bct013.apil@pcampus.edu.np`, the application and Firestore security rules permit creating their `/roles/{uid}` record as `admin`.
- Subsequent user roles default to `student` unless promoted by an Admin.

### 4. Code & Showcase Sandboxing
To ensure scripts are allowed inside student-uploaded custom showcases (`html` + `css` files) without posing a Stored XSS threat to the parent portal:
- Showcase HTML & CSS content is loaded dynamically inside a sandboxed `<iframe>` with `sandbox="allow-scripts"`.
- This ensures the showcase runs javascript locally in its own origin but cannot access parent document cookies, session states, local storage, or navigate the top-level window.

---

## 🚀 Setting Up & Deploying

### Firestore Security Rules Deployment
To deploy the security rules included in `/firestore.rules`:
```bash
firebase deploy --only firestore:rules
```

### Run Locally
1. Ensure dependencies are installed:
   ```bash
   npm install
   ```
2. Start the development server on Port 3000:
   ```bash
   npm run dev
   ```
3. Build the application:
   ```bash
   npm run build
   ```
