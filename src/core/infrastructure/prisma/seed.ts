import { PrismaClient, Priority, TaskType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clean database in correct order to avoid foreign key constraints
  await prisma.attachment.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.task.deleteMany();
  await prisma.column.deleteMany();
  await prisma.board.deleteMany();
  await prisma.user.deleteMany();

  console.log('🧹 Database cleaned');

  // Create users
  const hashedPassword = await bcrypt.hash('Admin123!', 10);

  const admin = await prisma.user.create({
    data: {
      id: 'user-1',
      name: 'Admin User',
      email: 'admin@example.com',
      password: hashedPassword,
    },
  });

  const user2 = await prisma.user.create({
    data: {
      id: 'user-2',
      name: 'John Developer',
      email: 'john@example.com',
      password: await bcrypt.hash('Dev123!', 10),
    },
  });

  const user3 = await prisma.user.create({
    data: {
      id: 'user-3',
      name: 'Jane Tester',
      email: 'jane@example.com',
      password: await bcrypt.hash('Test123!', 10),
    },
  });

  console.log(`✅ Created ${await prisma.user.count()} users`);

  // Create board
  const board = await prisma.board.create({
    data: {
      id: 'board-1',
      title: 'Project Management Board',
      ownerId: admin.id,
    },
  });

  console.log(`✅ Created board: ${board.title}`);

  // Create columns
  const columns = await Promise.all([
    prisma.column.create({
      data: {
        id: 'col-1',
        title: 'Backlog',
        boardId: board.id,
        order: 0,
      },
    }),
    prisma.column.create({
      data: {
        id: 'col-2',
        title: 'To Do',
        boardId: board.id,
        order: 1,
      },
    }),
    prisma.column.create({
      data: {
        id: 'col-3',
        title: 'In Progress',
        boardId: board.id,
        order: 2,
      },
    }),
    prisma.column.create({
      data: {
        id: 'col-4',
        title: 'Review',
        boardId: board.id,
        order: 3,
      },
    }),
    prisma.column.create({
      data: {
        id: 'col-5',
        title: 'Done',
        boardId: board.id,
        order: 4,
      },
    }),
  ]);

  console.log(`✅ Created ${columns.length} columns`);

  // Create tasks
  const tasks = await Promise.all([
    // Feature tasks
    prisma.task.create({
      data: {
        id: 'task-1',
        title: 'User Authentication System',
        description: 'Implement JWT-based authentication with refresh tokens',
        estimate: 8,
        estimateUnit: 'hours',
        priority: Priority.HIGH,
        type: TaskType.FEATURE,
        columnId: columns[0].id,
        assigneeId: user2.id,
        complexity: 'high',
      },
    }),
    prisma.task.create({
      data: {
        id: 'task-2',
        title: 'Dashboard UI Implementation',
        description: 'Create main dashboard with analytics widgets',
        estimate: 6,
        estimateUnit: 'hours',
        priority: Priority.MEDIUM,
        type: TaskType.FEATURE,
        columnId: columns[1].id,
        assigneeId: user2.id,
        complexity: 'medium',
      },
    }),
    prisma.task.create({
      data: {
        id: 'task-3',
        title: 'REST API Integration',
        description: 'Connect frontend to backend REST APIs with error handling',
        estimate: 4,
        estimateUnit: 'hours',
        priority: Priority.HIGH,
        type: TaskType.FEATURE,
        columnId: columns[2].id,
        assigneeId: user2.id,
        complexity: 'medium',
      },
    }),
    prisma.task.create({
      data: {
        id: 'task-9',
        title: 'User Profile Management',
        description: 'Allow users to view and edit their profile information',
        estimate: 5,
        estimateUnit: 'hours',
        priority: Priority.MEDIUM,
        type: TaskType.FEATURE,
        columnId: columns[2].id,
        assigneeId: user2.id,
        complexity: 'low',
      },
    }),
    prisma.task.create({
      data: {
        id: 'task-10',
        title: 'Real-time Notification System',
        description: 'Implement WebSocket-based real-time notifications',
        estimate: 8,
        estimateUnit: 'hours',
        priority: Priority.HIGH,
        type: TaskType.FEATURE,
        columnId: columns[3].id,
        assigneeId: user2.id,
        complexity: 'high',
      },
    }),

    // Bug tasks
    prisma.task.create({
      data: {
        id: 'task-4',
        title: 'Login Page Crash on Safari',
        description: 'Login page crashes when using Safari browser version 15+',
        estimate: 3,
        estimateUnit: 'hours',
        priority: Priority.CRITICAL,
        type: TaskType.BUG,
        columnId: columns[2].id,
        assigneeId: user3.id,
        severity: 'critical',
      },
    }),
    prisma.task.create({
      data: {
        id: 'task-5',
        title: 'Dashboard Data Not Loading',
        description: 'Dashboard widgets fail to load data on page refresh',
        estimate: 2,
        estimateUnit: 'hours',
        priority: Priority.HIGH,
        type: TaskType.BUG,
        columnId: columns[3].id,
        assigneeId: user3.id,
        severity: 'major',
      },
    }),
    prisma.task.create({
      data: {
        id: 'task-6',
        title: 'UI Alignment Issues on Mobile',
        description: 'Misaligned UI elements on mobile viewport width',
        estimate: 1,
        estimateUnit: 'hours',
        priority: Priority.LOW,
        type: TaskType.BUG,
        columnId: columns[4].id,
        assigneeId: user3.id,
        severity: 'minor',
      },
    }),

    // Epic tasks
    prisma.task.create({
      data: {
        id: 'task-7',
        title: 'Complete UI/UX Revamp',
        description: 'Full redesign of the entire application interface',
        estimate: 40,
        estimateUnit: 'hours',
        priority: Priority.HIGH,
        type: TaskType.EPIC,
        columnId: columns[0].id,
        assigneeId: admin.id,
      },
    }),
    prisma.task.create({
      data: {
        id: 'task-8',
        title: 'Application Performance Optimization',
        description: 'Optimize application performance and reduce load times',
        estimate: 30,
        estimateUnit: 'hours',
        priority: Priority.MEDIUM,
        type: TaskType.EPIC,
        columnId: columns[1].id,
        assigneeId: admin.id,
      },
    }),
  ]);

  console.log(`✅ Created ${tasks.length} tasks`);

  // Create comments
  const comments = await Promise.all([
    prisma.comment.create({
      data: {
        id: 'comment-1',
        content: 'This is a critical security issue that needs immediate attention',
        taskId: 'task-4',
        authorId: admin.id,
      },
    }),
    prisma.comment.create({
      data: {
        id: 'comment-2',
        content: 'I have started working on the UI revamp. Will share mockups by EOD.',
        taskId: 'task-7',
        authorId: user2.id,
      },
    }),
    prisma.comment.create({
      data: {
        id: 'comment-3',
        content: 'Performance optimization is in progress. Initial metrics show 20% improvement.',
        taskId: 'task-8',
        authorId: admin.id,
      },
    }),
    prisma.comment.create({
      data: {
        id: 'comment-4',
        content: 'Found the root cause. Will fix it today.',
        taskId: 'task-4',
        authorId: user3.id,
      },
    }),
    prisma.comment.create({
      data: {
        id: 'comment-5',
        content: 'Dashboard data loading issue seems to be related to API timeout. Increasing timeout.',
        taskId: 'task-5',
        authorId: user3.id,
      },
    }),
  ]);

  console.log(`✅ Created ${comments.length} comments`);

  // Create attachments
  const attachments = await Promise.all([
    prisma.attachment.create({
      data: {
        id: 'attach-1',
        fileName: 'ui-design-specs.pdf',
        fileUrl: '/uploads/design-specs.pdf',
        fileSize: 2048576,
        mimeType: 'application/pdf',
        taskId: 'task-7',
        uploadedBy: admin.id,
      },
    }),
    prisma.attachment.create({
      data: {
        id: 'attach-2',
        fileName: 'login-error-screenshot.png',
        fileUrl: '/uploads/error-screenshot.png',
        fileSize: 524288,
        mimeType: 'image/png',
        taskId: 'task-4',
        uploadedBy: user3.id,
      },
    }),
    prisma.attachment.create({
      data: {
        id: 'attach-3',
        fileName: 'performance-report.pdf',
        fileUrl: '/uploads/performance-report.pdf',
        fileSize: 1572864,
        mimeType: 'application/pdf',
        taskId: 'task-8',
        uploadedBy: admin.id,
      },
    }),
  ]);

  console.log(`✅ Created ${attachments.length} attachments`);

  // Final summary
  const summary = {
    users: await prisma.user.count(),
    boards: await prisma.board.count(),
    columns: await prisma.column.count(),
    tasks: await prisma.task.count(),
    comments: await prisma.comment.count(),
    attachments: await prisma.attachment.count(),
  };

  console.log('\n📊 Seed Summary:');
  console.log(`   Users: ${summary.users}`);
  console.log(`   Boards: ${summary.boards}`);
  console.log(`   Columns: ${summary.columns}`);
  console.log(`   Tasks: ${summary.tasks}`);
  console.log(`   Comments: ${summary.comments}`);
  console.log(`   Attachments: ${summary.attachments}`);
  console.log('\n🎉 Database seeding completed successfully!');
}

main()
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });