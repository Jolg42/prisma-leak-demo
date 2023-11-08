import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Post, Prisma, PrismaClient } from '@prisma/client';
import { MemoryLogger } from './memory-logger';

const CONCURRENCY = 300;
const POSTS_PER_USER = 10;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3007);
}

async function doPrismaWorkForever(): Promise<void> {
  const prisma = new PrismaClient();
  const memoryLogger = new MemoryLogger();

  // Do this many concurrent creates & deletes.
  while (true) {
    await Promise.all(
      Array.from({ length: CONCURRENCY }, () => doOnePrimsaLoop(prisma)),
    );
    memoryLogger.maybeLog();
  }
}

async function doOnePrimsaLoop(prisma: PrismaClient): Promise<void> {
  try {
    // Create one user with a bunch of posts.
    const createdUser = await prisma.user.create({
      data: {
        name: `Sample`,
        email: `sample@email.com`,
        posts: {
          createMany: {
            data: Array.from({ length: POSTS_PER_USER }, (_, i) => ({
              title: `Sample Post ${i}`,
              content: `content ${i}`,
              published: false,
            })),
          },
        },
      },
      include: { posts: true },
    });

    // Do an update on all the posts with queryRaw.
    const postIds = createdUser.posts.map((p) => p.id);
    await prisma.$queryRaw<Post>`update "Post" set "published" = TRUE where id = ANY(ARRAY[${Prisma.join(
      postIds,
    )}]) returning *`;

    // Delete user and posts in one transaction.
    await prisma.$transaction([
      prisma.post.deleteMany({ where: { authorId: createdUser.id } }),
      prisma.user.delete({ where: { id: createdUser.id } }),
    ]);
  } catch (e) {
    console.error("doOnePrimsaLoop", e);
  }
}

bootstrap();
doPrismaWorkForever();
