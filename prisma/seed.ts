import {
  PrismaClient,
  ConversationType,
  MessageRole,
  SocialGoalStatus,
  ConnectionEventType,
  EmotionTag,
} from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.user.deleteMany({ where: { email: "demo@aiah.app" } });

  const user = await prisma.user.create({
    data: {
      email: "demo@aiah.app",
      name: "Alex",
      onboardingComplete: true,
      connectionScore: 34,
      city: "San Francisco",
      anxietyLevel: 3,
      voicePreferred: false,
      memorySnippet: "Recently moved; wants low-pressure ways to meet neighbors.",
    },
  });

  await prisma.userStreak.create({
    data: {
      userId: user.id,
      currentStreak: 5,
      longestStreak: 7,
      lastCheckInDate: new Date(),
    },
  });

  const today = new Date();
  const checkin = await prisma.conversation.create({
    data: {
      userId: user.id,
      type: ConversationType.DAILY_CHECKIN,
      title: `Check-in · ${today.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
    },
  });

  await prisma.message.createMany({
    data: [
      {
        conversationId: checkin.id,
        role: MessageRole.ASSISTANT,
        content:
          "Hey Alex - good to see you. Yesterday you mentioned wanting a calmer morning walk. What’s one small moment from today that felt a little lighter?",
      },
      {
        conversationId: checkin.id,
        role: MessageRole.USER,
        content: "I actually said hi to someone at the coffee shop. It was awkward but I did it.",
        emotionTag: EmotionTag.HAPPY,
      },
      {
        conversationId: checkin.id,
        role: MessageRole.ASSISTANT,
        content:
          "That counts - a lot. What did you notice in your body right after you said it? And what’s one tiny next step with a real person you could try before bed?",
      },
      {
        conversationId: checkin.id,
        role: MessageRole.USER,
        content: "Maybe I’ll nod to my neighbor if I see them in the hall.",
        emotionTag: EmotionTag.ANXIOUS,
      },
    ],
  });

  const coaching = await prisma.conversation.create({
    data: {
      userId: user.id,
      type: ConversationType.SOCIAL_COACHING,
      title: "Practice session",
      scenarioId: "salary-negotiation",
    },
  });

  await prisma.message.createMany({
    data: [
      {
        conversationId: coaching.id,
        role: MessageRole.ASSISTANT,
        content:
          "Hey! I think we’re on the same floor - I’m Jamie. [Coaching: open with something observational and short.]",
      },
      {
        conversationId: coaching.id,
        role: MessageRole.USER,
        content: "Oh hi - yeah, I just moved in last week. I’m Alex.",
        emotionTag: EmotionTag.ANXIOUS,
      },
      {
        conversationId: coaching.id,
        role: MessageRole.ASSISTANT,
        content:
          "Welcome! How are you settling in? [Coaching: invite a low-stakes answer - not too broad.]",
      },
      {
        conversationId: coaching.id,
        role: MessageRole.USER,
        content: "Still living out of boxes, but the light in the apartment is nice.",
        emotionTag: EmotionTag.NEUTRAL,
      },
      {
        conversationId: coaching.id,
        role: MessageRole.ASSISTANT,
        content:
          "That’s a win. If you want, I’m around - happy to recommend a good takeout spot. [Coaching: offer an easy exit cue so it doesn’t feel trapped.]",
      },
      {
        conversationId: coaching.id,
        role: MessageRole.USER,
        content: "That would be great - thanks. Have a good night.",
        emotionTag: EmotionTag.HAPPY,
      },
    ],
  });

  const general = await prisma.conversation.create({
    data: {
      userId: user.id,
      type: ConversationType.GENERAL,
      title: "Catching up",
    },
  });

  await prisma.message.createMany({
    data: [
      {
        conversationId: general.id,
        role: MessageRole.USER,
        content: "I’ve been feeling a little invisible at work lately.",
        emotionTag: EmotionTag.LONELY,
      },
      {
        conversationId: general.id,
        role: MessageRole.ASSISTANT,
        content:
          "That sounds heavy - and pretty human after a move. When you say invisible, is it more in meetings, or more day-to-day small interactions?",
      },
      {
        conversationId: general.id,
        role: MessageRole.USER,
        content: "Mostly meetings. I talk and it feels like the room skips ahead.",
        emotionTag: EmotionTag.SAD,
      },
      {
        conversationId: general.id,
        role: MessageRole.ASSISTANT,
        content:
          "Ouch. One thing that sometimes helps is naming one ally and practicing a single sentence you could say after the meeting - not to perform, just to be seen. Who’s one person you wouldn’t mind sounding a little vulnerable to?",
      },
    ],
  });

  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);

  await prisma.socialGoal.createMany({
    data: [
      {
        userId: user.id,
        title: "Say hi to my neighbor",
        description: "Keep it to a wave or a quick hello.",
        status: SocialGoalStatus.COMPLETED,
        completedAt: new Date(Date.now() - 3 * 86400000),
      },
      {
        userId: user.id,
        title: "Text my college friend Jamie",
        description: "Send a no-pressure message - a meme counts.",
        status: SocialGoalStatus.ACTIVE,
      },
      {
        userId: user.id,
        title: "Attend a local hiking meetup",
        description: "Show up for 20 minutes; leaving early is allowed.",
        status: SocialGoalStatus.ACTIVE,
      },
      {
        userId: user.id,
        title: "Ask coworker to grab lunch",
        description: "Pick Tuesday or Wednesday; keep the invite simple.",
        status: SocialGoalStatus.ACTIVE,
        targetDate: nextWeek,
      },
    ],
  });

  const days = 14;
  const events: Array<{
    type: ConnectionEventType;
    pointsAwarded: number;
    note: string | null;
    createdAt: Date;
    badgeKey?: string | null;
  }> = [];

  for (let i = 0; i < days; i++) {
    const createdAt = new Date();
    createdAt.setUTCDate(createdAt.getUTCDate() - (days - i));
    if (i % 3 === 0) {
      events.push({
        type: ConnectionEventType.DAILY_CHECKIN,
        pointsAwarded: 2,
        note: "Daily check-in",
        createdAt,
      });
    }
    if (i === 5) {
      events.push({
        type: ConnectionEventType.BADGE_UNLOCKED,
        pointsAwarded: 0,
        note: "First Step",
        badgeKey: "FIRST_STEP",
        createdAt,
      });
    }
    if (i === 10) {
      events.push({
        type: ConnectionEventType.COACHING_COMPLETED,
        pointsAwarded: 1,
        note: "Neighbor scenario",
        createdAt,
      });
    }
  }

  events.push({
    type: ConnectionEventType.GOAL_COMPLETED,
    pointsAwarded: 5,
    note: "Say hi to my neighbor",
    createdAt: new Date(),
  });

  for (const e of events) {
    await prisma.connectionEvent.create({
      data: {
        userId: user.id,
        type: e.type,
        pointsAwarded: e.pointsAwarded,
        note: e.note,
        badgeKey: e.badgeKey ?? null,
        createdAt: e.createdAt,
      },
    });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { connectionScore: 34 },
  });

  // eslint-disable-next-line no-console
  console.log("Seed complete - demo user: demo@aiah.app");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
